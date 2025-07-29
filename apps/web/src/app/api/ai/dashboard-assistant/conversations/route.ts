import { NextResponse } from 'next/server';
import { db, dashboardAssistantConversations, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';

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

    const conversations = await db.query.dashboardAssistantConversations.findMany({
      where: eq(dashboardAssistantConversations.userId, userId),
      orderBy: (conversations, { desc }) => [desc(conversations.updatedAt)],
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to get dashboard assistant conversations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}