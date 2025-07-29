import { NextRequest, NextResponse } from 'next/server';
import { decodeToken, getUserGroups, buildTree } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { pages, drives, pageType, permissions, aiChats, users, db, and, eq, inArray, asc, sql } from '@pagespace/db';
import { z } from 'zod';

async function getPermittedPages(driveId: string, userId: string) {
  const groupIds = await getUserGroups(userId, driveId);
  const subjectIds = [userId, ...groupIds];

  const permittedPageIdsQuery = await db.selectDistinct({ id: pages.id })
    .from(pages)
    .leftJoin(permissions, eq(pages.id, permissions.pageId))
    .where(and(
      eq(pages.driveId, driveId),
      eq(pages.isTrashed, false),
      inArray(permissions.subjectId, subjectIds)
    ));
  const permittedPageIds = permittedPageIdsQuery.map(p => p.id);

  if (permittedPageIds.length === 0) {
    return [];
  }

  const ancestorIdsQuery = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, "parentId"
      FROM "Page"
      WHERE id IN ${permittedPageIds}
      UNION ALL
      SELECT p.id, p."parentId"
      FROM "Page" p
      JOIN ancestors a ON p.id = a."parentId"
    )
    SELECT id FROM ancestors;
  `);
  const ancestorIds = (ancestorIdsQuery as unknown as { id: string }[]).map(r => r.id);

  const allVisiblePageIds = [...new Set([...permittedPageIds, ...ancestorIds])];

  return db.query.pages.findMany({
    where: and(
      inArray(pages.id, allVisiblePageIds),
      eq(pages.isTrashed, false)
    ),
    orderBy: [asc(pages.position)],
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ driveSlug: string }> }
) {
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

  try {
    const { driveSlug } = await context.params;

    // Find drive by slug, but don't scope to owner yet
    const drive = await db.query.drives.findFirst({
      where: eq(drives.slug, driveSlug),
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    let pageResults;

    // If user owns the drive, fetch all pages
    if (drive.ownerId === userId) {
      pageResults = await db.query.pages.findMany({
        where: and(
          eq(pages.driveId, drive.id),
          eq(pages.isTrashed, false)
        ),
        orderBy: [asc(pages.position)],
      });
    } else {
      // If user does not own the drive, fetch only permitted pages and their ancestors
      pageResults = await getPermittedPages(drive.id, userId);
    }

    const pageTree = buildTree(pageResults);
    return NextResponse.json(pageTree);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

const createPageSchema = z.object({
  title: z.string().min(1),
  type: z.enum(pageType.enumValues),
  parentId: z.string().nullable(),
  position: z.number(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ driveSlug: string }> }
) {
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

  try {
    const { driveSlug } = await context.params;
    const body = await request.json();
    const { title, type, parentId, position } = createPageSchema.parse(body);

    const newPage = await db.transaction(async (tx) => {
      const drive = await tx.query.drives.findFirst({
        where: and(eq(drives.ownerId, userId), eq(drives.slug, driveSlug)),
      });

      if (!drive) {
        throw new Error('Drive not found or access denied.');
      }

      if (parentId) {
        const parentPage = await tx.query.pages.findFirst({
          where: and(eq(pages.id, parentId), eq(pages.driveId, drive.id)),
        });
        if (!parentPage) {
          throw new Error('Parent page not found in the specified drive.');
        }
      }

      const [createdPage] = await tx.insert(pages).values({
        title,
        type,
        position,
        driveId: drive.id,
        parentId,
        updatedAt: new Date(),
      }).returning();

      if (createdPage.type === 'AI_CHAT') {
        const user = await tx.query.users.findFirst({
          where: eq(users.id, userId),
        });
        
        const model = user?.lastUsedAiModel || 'ollama:qwen3:8b';

        await tx.insert(aiChats).values({
          pageId: createdPage.id,
          model,
          temperature: 0.7,
        });
      }

      return createdPage;
    });

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create page';
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}