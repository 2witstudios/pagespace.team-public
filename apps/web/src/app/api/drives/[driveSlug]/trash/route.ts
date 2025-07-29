import { NextResponse } from 'next/server';
import { drives, pages } from '@pagespace/db';
import { db, and, eq, asc } from '@pagespace/db';
import { decodeToken, buildTree } from '@pagespace/lib/server';
import { parse } from 'cookie';

interface DriveParams {
  driveSlug: string;
}

export async function GET(request: Request, context: { params: Promise<DriveParams> }) {
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

    const { driveSlug } = await context.params;

    try {
        const drive = await db.query.drives.findFirst({
            where: and(
                eq(drives.slug, driveSlug),
                eq(drives.ownerId, session.user.id)
            ),
        });

        if (!drive) {
            return NextResponse.json({ error: 'Drive not found or you do not have permission to view its trash.' }, { status: 404 });
        }

        const trashedPages = await db.query.pages.findMany({
            where: and(
                eq(pages.driveId, drive.id),
                eq(pages.isTrashed, true)
            ),
            with: {
                children: true,
            },
            orderBy: [asc(pages.position)],
        });

        // We will build a tree from the flat list of trashed pages
        const tree = buildTree(trashedPages);

        return NextResponse.json(tree);
    } catch (error) {
        console.error('Failed to fetch trashed pages:', error);
        return NextResponse.json({ error: 'Failed to fetch trashed pages' }, { status: 500 });
    }
}