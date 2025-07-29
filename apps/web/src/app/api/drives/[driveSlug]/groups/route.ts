import { NextResponse } from 'next/server';
import { drives, groups, db, and, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { createId } from '@paralleldrive/cuid2';
import { parse } from 'cookie';
import { z } from 'zod';

async function checkDriveAccess(driveSlug: string, userId: string) {
    const drive = await db.query.drives.findFirst({
        where: and(eq(drives.slug, driveSlug), eq(drives.ownerId, userId)),
    });
    return !!drive;
}

export async function GET(
  request: Request,
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
  const session = { user: { id: decoded.userId } };
  const params = await context.params;

  if (!(await checkDriveAccess(params.driveSlug, session.user.id))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

    try {
        const drive = await db.query.drives.findFirst({ where: and(eq(drives.slug, params.driveSlug), eq(drives.ownerId, session.user.id)) });
        if (!drive) {
            return new NextResponse("Forbidden", { status: 403 });
        }
        const groupResults = await db.query.groups.findMany({
            where: eq(groups.driveId, drive.id),
        });
        return NextResponse.json(groupResults);
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }
}

const postSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export async function POST(
  request: Request,
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
  const session = { user: { id: decoded.userId } };
  const params = await context.params;

  const drive = await db.query.drives.findFirst({
    where: and(eq(drives.slug, params.driveSlug), eq(drives.ownerId, session.user.id)),
  });
  if (!drive) {
    return new NextResponse("Forbidden", { status: 403 });
  }

    try {
        const body = await request.json();
        const { name } = postSchema.parse(body);

        const newGroup = await db.insert(groups).values({
            id: createId(),
            name,
            driveId: drive.id,
            updatedAt: new Date(),
        }).returning();

        return NextResponse.json(newGroup, { status: 201 });
    } catch (error) {
        console.error('Error creating group:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }
}