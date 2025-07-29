import { NextResponse } from 'next/server';
import { pages, db, and, eq, asc } from '@pagespace/db';
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

  const decoded = decodeToken(accessToken);
  if (!decoded) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const children = await db.query.pages.findMany({
      where: and(
        eq(pages.parentId, pageId),
        eq(pages.isTrashed, false)
      ),
      orderBy: [asc(pages.position)],
    });
    return NextResponse.json(children);
  } catch (error) {
    console.error(`Error fetching children for page ${pageId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch page children' }, { status: 500 });
  }
}