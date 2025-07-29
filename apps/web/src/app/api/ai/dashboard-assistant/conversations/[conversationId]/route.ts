import { NextResponse } from 'next/server';
import { db, dashboardAssistantMessages, eq, and } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';

export async function GET(
  req: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
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

    const messages = await db.query.dashboardAssistantMessages.findMany({
      where: and(
        eq(dashboardAssistantMessages.conversationId, conversationId),
        eq(dashboardAssistantMessages.isActive, true)
      ),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to get dashboard assistant messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}