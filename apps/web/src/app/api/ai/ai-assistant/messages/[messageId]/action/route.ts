import { NextRequest, NextResponse } from 'next/server';
import { db, assistantMessages, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ messageId: string }> },
) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const cookies = parse(cookieHeader || '');
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    const decoded = await decodeToken(accessToken);
    if (!decoded) {
      return new Response("Unauthorized", { status: 401 });
    }
    const userId = decoded.userId;

    const { messageId } = await context.params;

    // First, verify that the message belongs to the user
    const message = await db.query.assistantMessages.findFirst({
      where: eq(assistantMessages.id, messageId),
      with: {
        conversation: {
          columns: {
            userId: true,
          },
        },
      },
    });

    if (!message || message.conversation.userId !== userId) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    await db
      .update(assistantMessages)
      .set({ toolCallActioned: true })
      .where(eq(assistantMessages.id, messageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating tool call status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}