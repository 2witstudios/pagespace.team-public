import { NextResponse } from 'next/server';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { drives, pages, aiChats, users, db, and, eq, desc } from '@pagespace/db';

export async function POST(request: Request) {
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
  const session = { user: { id: decoded.userId } };

  try {
    const { title, type, parentId, driveSlug } = await request.json();

    if (!title || !type || !driveSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const drive = await db.query.drives.findFirst({
      where: and(eq(drives.slug, driveSlug), eq(drives.ownerId, session.user.id)),
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    // Get the highest position for the current parent
    const lastPage = await db.query.pages.findFirst({
      where: and(eq(pages.parentId, parentId), eq(pages.driveId, drive.id)),
      orderBy: [desc(pages.position)],
    });

    const newPosition = (lastPage?.position || 0) + 1;

    const newPage = await db.transaction(async (tx) => {
      const [page] = await tx.insert(pages).values({
        title,
        type: type,
        parentId,
        driveId: drive.id,
        content: '',
        position: newPosition,
        updatedAt: new Date(),
      }).returning();

      let aiChat;
      if (type === 'AI_CHAT') {
        const user = await tx.query.users.findFirst({
          where: eq(users.id, session.user.id),
        });
        [aiChat] = await tx.insert(aiChats).values({
          pageId: page.id,
          model: user?.lastUsedAiModel || 'ollama:qwen3:8b',
        }).returning();
      }
      
      return { ...page, aiChat };
    });

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}