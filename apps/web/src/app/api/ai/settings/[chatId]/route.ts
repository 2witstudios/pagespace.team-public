import { NextResponse } from 'next/server';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { aiChats, db, eq } from '@pagespace/db';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ chatId: string }> }
) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const decoded = await decodeToken(accessToken);
  if (!decoded) {
    return new Response("Unauthorized", { status: 401 });
  }
  const session = { user: { id: decoded.userId } };

  const { chatId } = await context.params;
  const body = await req.json();
  const { model, temperature, systemPrompt } = body;

  try {
    // This is a complex update because we need to verify ownership through a series of joins.
    // A raw SQL query or a more complex Drizzle query would be needed here.
    // For now, we'll do it in two steps for clarity.

    const chatToUpdate = await db.query.aiChats.findFirst({
        where: eq(aiChats.id, chatId),
        with: {
            page: {
                with: {
                    drive: {
                        columns: {
                            ownerId: true
                        }
                    }
                }
            }
        }
    });

    if (chatToUpdate?.page?.drive?.ownerId !== session.user.id) {
        return new Response("Forbidden", { status: 403 });
    }

    const chat = await db.update(aiChats).set({
        model,
        temperature,
        systemPrompt,
    }).where(eq(aiChats.id, chatId)).returning();

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Failed to update chat settings:', error);
    return new Response('Failed to update chat settings', { status: 500 });
  }
}