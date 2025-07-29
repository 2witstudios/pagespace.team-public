import { NextResponse } from 'next/server';
import { z } from 'zod';
import { pages, aiChats, users, db, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';

const patchSchema = z.object({
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().optional(),
  providerOverride: z.string().optional(),
});

export async function GET(
  req: Request,
  context: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await context.params;
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

  try {
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    });

    if (!page) {
      return new NextResponse('Page not found', { status: 404 });
    }

    const aiChat = await db.query.aiChats.findFirst({
      where: eq(aiChats.pageId, pageId),
    });

    // Return default settings if no AI chat exists yet
    // Try to get user's last used model or fallback to qwen3:8b
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });
    
    const defaultModel = user?.lastUsedAiModel || 'ollama:qwen3:8b';
    
    const settings = aiChat || {
      model: defaultModel,
      temperature: 0.7,
      systemPrompt: null,
      providerOverride: null,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching AI chat settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  req: Request, 
  context: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await context.params;
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
  const userId = decoded.userId;

  try {
    const body = await req.json();
    const validatedBody = patchSchema.parse(body);

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    });

    if (!page) {
      return new NextResponse('Page not found', { status: 404 });
    }

    const existingAiChat = await db.query.aiChats.findFirst({
      where: eq(aiChats.pageId, pageId),
    });

    let aiChat;
    if (existingAiChat) {
      aiChat = await db.update(aiChats).set(validatedBody).where(eq(aiChats.id, existingAiChat.id)).returning();
    } else {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      const model = validatedBody.model || user?.lastUsedAiModel || 'ollama:qwen3:8b';

      aiChat = await db.insert(aiChats).values({
        ...validatedBody,
        model,
        pageId: pageId,
      }).returning();
    }

    return NextResponse.json(aiChat);
  } catch (error) {
    console.error('Error updating AI chat settings:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), {
        status: 400,
      });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}