import { NextResponse } from 'next/server';
import { pages, db, and, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';

async function recursivelyRestore(pageId: string, tx: typeof db) {
    await tx.update(pages).set({ isTrashed: false, trashedAt: null }).where(eq(pages.id, pageId));

    const children = await tx.select({ id: pages.id }).from(pages).where(and(eq(pages.parentId, pageId), eq(pages.isTrashed, true)));

    for (const child of children) {
        await recursivelyRestore(child.id, tx);
    }

    const orphanedChildren = await tx.select({ id: pages.id }).from(pages).where(eq(pages.originalParentId, pageId));

    for (const child of orphanedChildren) {
        await tx.update(pages).set({ parentId: pageId, originalParentId: null }).where(eq(pages.id, child.id));
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const decoded = decodeToken(accessToken);
  if (!decoded) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const page = await db.query.pages.findFirst({ where: eq(pages.id, pageId) });
    if (!page || !page.isTrashed) {
      return NextResponse.json({ error: 'Page is not in trash' }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      await recursivelyRestore(pageId, tx);
    });

    return NextResponse.json({ message: 'Page restored successfully.' });
  } catch (error) {
    console.error('Error restoring page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to restore page';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}