import { NextResponse } from 'next/server';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { pages, drives, assistantConversations, chatMessages, aiChats, users } from '@pagespace/db';
import { db, eq, count, isNull } from '@pagespace/db';
import { z } from 'zod';

const postSchema = z.object({
  assistantConversationId: z.string(),
  parentPageId: z.string().optional(),
  driveId: z.string(),
});

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parse(cookieHeader || '');
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const decoded = await decodeToken(accessToken);
    if (!decoded) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const session = { user: { id: decoded.userId } };

    const body = await req.json();
    const { assistantConversationId, parentPageId, driveId } = postSchema.parse(body);

    const conversation = await db.query.assistantConversations.findFirst({
      where: eq(assistantConversations.id, assistantConversationId),
      with: { messages: true },
    });

    if (!conversation || conversation.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const newPage = await db.transaction(async (tx) => {
      const positionQuery = await tx.select({ value: count() }).from(pages).where(
        parentPageId ? eq(pages.parentId, parentPageId) : isNull(pages.parentId)
      );
      const position = positionQuery[0].value + 1;

      const [createdPage] = await tx.insert(pages).values({
        title: conversation.title,
        type: 'AI_CHAT',
        driveId: driveId,
        parentId: parentPageId,
        position: position,
        updatedAt: new Date(),
      }).returning();

      const user = await tx.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });

      await tx.insert(aiChats).values({
        pageId: createdPage.id,
        model: user?.lastUsedAiModel || 'ollama:qwen3:8b',
      });

      if (conversation.messages.length > 0) {
        await tx.insert(chatMessages).values(conversation.messages.map(msg => ({
          pageId: createdPage.id,
          userId: msg.role === 'user' ? session.user.id : null,
          role: msg.role,
          content: msg.content,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults,
          createdAt: msg.createdAt,
        })));
      }

      await tx.delete(assistantConversations).where(eq(assistantConversations.id, assistantConversationId));

      return createdPage;
    });

    const drive = await db.query.drives.findFirst({ where: eq(drives.id, driveId) });

    return NextResponse.json({
      pageId: newPage.id,
      driveSlug: drive?.slug,
    });

  } catch (error) {
    console.error('Error promoting conversation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to promote conversation' }, { status: 500 });
  }
}