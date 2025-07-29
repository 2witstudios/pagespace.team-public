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