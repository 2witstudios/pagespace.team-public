import { NextResponse } from 'next/server';
import { channelMessages, db, eq, asc } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';

export async function GET(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
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

  const messages = await db.query.channelMessages.findMany({
    where: eq(channelMessages.pageId, pageId),
    with: {
      user: {
        columns: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: [asc(channelMessages.createdAt)],
  });
  return NextResponse.json(messages);
}

export async function POST(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
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

  const { content } = await req.json();
  
  // Debug: Check what content type is being received
  console.log('API received content type:', typeof content);
  console.log('API received content:', content);
  const [createdMessage] = await db.insert(channelMessages).values({
    pageId: pageId,
    userId: userId,
    content,
  }).returning();

  const newMessage = await db.query.channelMessages.findFirst({
      where: eq(channelMessages.id, createdMessage.id),
      with: {
          user: {
              columns: {
                  name: true,
                  image: true,
              }
          }
      }
  });

  // Debug: Check what type the content is
  console.log('Database returned content type:', typeof newMessage?.content);
  console.log('Database returned content:', newMessage?.content);

  // Broadcast the new message to the channel
  if (process.env.INTERNAL_REALTIME_URL) {
    try {
      await fetch(`${process.env.INTERNAL_REALTIME_URL}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: pageId,
          event: 'new_message',
          payload: newMessage,
        }),
      });
    } catch (error) {
      console.error('Failed to broadcast message to socket server:', error);
    }
  }

  return NextResponse.json(newMessage, { status: 201 });
}