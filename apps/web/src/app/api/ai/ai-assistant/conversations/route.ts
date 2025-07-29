import { NextResponse } from 'next/server';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { db, and, eq, desc } from '@pagespace/db';
import { assistantConversations } from '@pagespace/db';

export async function GET(req: Request) {
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
    const userId = decoded.userId;

    const { searchParams } = new URL(req.url);
    const driveId = searchParams.get('driveId');

    if (!driveId) {
      return NextResponse.json({ error: 'driveId is required' }, { status: 400 });
    }

    const conversations = await db.select({
      id: assistantConversations.id,
      title: assistantConversations.title,
      updatedAt: assistantConversations.updatedAt,
    })
    .from(assistantConversations)
    .where(
      and(
        eq(assistantConversations.userId, userId),
        eq(assistantConversations.driveId, driveId)
      )
    )
    .orderBy(desc(assistantConversations.updatedAt));

    return NextResponse.json(conversations);

  } catch (error) {
    console.error('Error fetching assistant conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

import { z } from 'zod';
import { nanoid } from 'nanoid';

const postSchema = z.object({
  driveId: z.string(),
  model: z.string(),
});

export async function POST(request: Request) {
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

    const body = await request.json();
    const { driveId, model } = postSchema.parse(body);

    const newConversation = await db
      .insert(assistantConversations)
      .values({
        id: nanoid(),
        userId,
        driveId,
        model,
        title: 'New Conversation',
      })
      .returning();

    return NextResponse.json(newConversation[0]);
  } catch (error) {
    console.error('[CONVERSATIONS_POST]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}