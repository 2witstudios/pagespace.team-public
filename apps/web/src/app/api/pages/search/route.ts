import { NextResponse } from 'next/server';
import { decodeToken, getUserAccessLevel } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { pages, db, and, eq, ilike } from '@pagespace/db';

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const driveId = searchParams.get('driveId');

  if (query === null || !driveId) {
    return NextResponse.json(
      { error: 'Missing query (q) or driveId parameters' },
      { status: 400 }
    );
  }

  try {
    const results = await db.select({
      id: pages.id,
      title: pages.title,
      type: pages.type,
    })
    .from(pages)
    .where(
      and(
        eq(pages.driveId, driveId),
        ilike(pages.title, `%${query}%`),
        eq(pages.isTrashed, false)
      )
    )
    .limit(10);

    const accessiblePages = [];
    for (const page of results) {
      const accessLevel = await getUserAccessLevel(userId, page.id);
      // Any access level is sufficient to be included in search results.
      if (accessLevel) {
        accessiblePages.push(page);
      }
    }

    return NextResponse.json(accessiblePages);
  } catch (error) {
    console.error('[PAGES_SEARCH_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}