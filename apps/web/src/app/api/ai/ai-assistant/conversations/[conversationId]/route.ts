import { NextResponse } from 'next/server';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { db, and, eq, asc } from '@pagespace/db';
import { assistantConversations, assistantMessages } from '@pagespace/db';
import { z } from 'zod';

const patchSchema = z.object({
  model: z.string().optional(),
  providerOverride: z.string().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const cookies = parse(cookieHeader || '');
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const decoded = await decodeToken(accessToken);
    if (!decoded) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = decoded.userId;

    const { conversationId } = await context.params;

    const conversation = await db.query.assistantConversations.findFirst({
      where: and(
        eq(assistantConversations.id, conversationId),
        eq(assistantConversations.userId, userId)
      ),
      with: {
        messages: {
          where: eq(assistantMessages.isActive, true),
          orderBy: [asc(assistantMessages.createdAt)],
        },
      },
    });

    if (!conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    return NextResponse.json({ 
      messages: conversation.messages,
      model: conversation.model,
      providerOverride: conversation.providerOverride,
    });
  } catch (error) {
    console.error('[CONVERSATION_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const cookies = parse(cookieHeader || '');
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const decoded = await decodeToken(accessToken);
    if (!decoded) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = decoded.userId;

    const { conversationId } = await context.params;
    const body = await request.json();
    const validatedBody = patchSchema.parse(body);

    const conversation = await db.query.assistantConversations.findFirst({
      where: and(
        eq(assistantConversations.id, conversationId),
        eq(assistantConversations.userId, userId)
      ),
    });

    if (!conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    const updatedConversation = await db
      .update(assistantConversations)
      .set({
        ...validatedBody,
        updatedAt: new Date(),
      })
      .where(eq(assistantConversations.id, conversationId))
      .returning();

    return NextResponse.json(updatedConversation[0]);
  } catch (error) {
    console.error('[CONVERSATION_PATCH]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}