import { NextResponse } from 'next/server';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { pages, drives, db, and, eq } from '@pagespace/db';
import { z } from 'zod';

const reorderSchema = z.object({
  pageId: z.string(),
  newParentId: z.string().nullable(),
  newPosition: z.number(),
});

export async function PATCH(request: Request) {
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
    const body = await request.json();
    const { pageId, newParentId, newPosition } = reorderSchema.parse(body);

    await db.transaction(async (tx) => {
      // 1. Verify user owns the page being moved
      const pageToMoveQuery = await tx.select({ driveId: pages.driveId })
        .from(pages)
        .leftJoin(drives, eq(pages.driveId, drives.id))
        .where(and(eq(pages.id, pageId), eq(drives.ownerId, userId)))
        .limit(1);
      
      const pageToMove = pageToMoveQuery[0];

      if (!pageToMove) {
        throw new Error("Page not found or user does not have access.");
      }

      // 2. If moving to a new parent, verify user owns the parent and it's in the same drive
      if (newParentId) {
        const parentPageQuery = await tx.select({ driveId: pages.driveId })
          .from(pages)
          .leftJoin(drives, eq(pages.driveId, drives.id))
          .where(and(eq(pages.id, newParentId), eq(drives.ownerId, userId)))
          .limit(1);
        
        const parentPage = parentPageQuery[0];

        if (!parentPage) {
          throw new Error("Parent page not found or user does not have access.");
        }

        if (parentPage.driveId !== pageToMove.driveId) {
          throw new Error("Cannot move pages between different drives.");
        }
      }

      // 3. Perform the update
      await tx.update(pages).set({
        parentId: newParentId,
        position: newPosition,
      }).where(eq(pages.id, pageId));
    });

    return NextResponse.json({ message: 'Page reordered successfully' });
  } catch (error) {
    console.error('Error reordering page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reorder page';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}