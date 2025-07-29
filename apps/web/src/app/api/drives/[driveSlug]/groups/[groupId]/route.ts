import { NextResponse } from 'next/server';
import { db, eq, and } from '@pagespace/db';
import { drives, groups } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { z } from 'zod';

async function checkDriveAccess(driveSlug: string, userId: string) {
    const drive = await db.query.drives.findFirst({
        where: and(eq(drives.slug, driveSlug), eq(drives.ownerId, userId)),
    });
    return !!drive;
}

const patchSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ driveSlug: string; groupId: string }> }
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
  const session = { user: { id: decoded.userId } };
  const params = await context.params;

  if (!(await checkDriveAccess(params.driveSlug, session.user.id))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

    try {
        const body = await request.json();
        const { name } = patchSchema.parse(body);

        const updatedGroup = await db.update(groups).set({ 
            name,
            updatedAt: new Date(),
        }).where(eq(groups.id, params.groupId)).returning().then(res => res[0]);

        return NextResponse.json(updatedGroup);
    } catch (error) {
        console.error('Error updating group:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ driveSlug: string; groupId: string }> }
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
  const session = { user: { id: decoded.userId } };
  const params = await context.params;

  if (!(await checkDriveAccess(params.driveSlug, session.user.id))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

    try {
        await db.delete(groups).where(eq(groups.id, params.groupId));

        return NextResponse.json({ message: 'Group deleted' });
    } catch (error) {
        console.error('Error deleting group:', error);
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }
}