import { NextResponse } from 'next/server';
import { pages, users, groups, permissions, permissionAction, subjectType, db, eq, inArray } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

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
    const pageWithDrive = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
      with: {
        drive: {
          with: {
            owner: {
              columns: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!pageWithDrive) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Fetch permissions separately to avoid circular dependency
    const pagePermissions = await db.query.permissions.findMany({
      where: eq(permissions.pageId, pageId),
    });
    const userIds = pagePermissions
      .filter((p) => p.subjectType === 'USER')
      .map((p) => p.subjectId);
    const groupIds = pagePermissions
      .filter((p) => p.subjectType === 'GROUP')
      .map((p) => p.subjectId);

    const userSubjects = userIds.length > 0 ? await db.select({ id: users.id, name: users.name, email: users.email, image: users.image }).from(users).where(inArray(users.id, userIds)) : [];
    const groupSubjects = groupIds.length > 0 ? await db.select({ id: groups.id, name: groups.name }).from(groups).where(inArray(groups.id, groupIds)) : [];

    const enrichedPermissions = pagePermissions.map((p) => {
      if (p.subjectType === 'USER') {
        const user = userSubjects.find((u) => u.id === p.subjectId);
        return { ...p, subject: user };
      }
      if (p.subjectType === 'GROUP') {
        const group = groupSubjects.find((g) => g.id === p.subjectId);
        return { ...p, subject: group };
      }
      return p;
    });

    return NextResponse.json({
      owner: pageWithDrive.drive.owner,
      permissions: enrichedPermissions,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

const postSchema = z.object({
  subjectId: z.string(),
  subjectType: z.enum(subjectType.enumValues),
  action: z.enum(permissionAction.enumValues),
});

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
    const body = await req.json();
    const { subjectId, subjectType, action } = postSchema.parse(body);

    // Ensure the user isn't trying to grant a permission greater than their own.
    // This is a simplified check; a more robust implementation would use the
    // full permission precedence array.
    if (action === 'DELETE') {
        return NextResponse.json({ error: 'Cannot grant DELETE permission' }, { status: 403 });
    }

    const newPermission = await db.insert(permissions).values({
      id: createId(),
      pageId: pageId,
      subjectId,
      subjectType,
      action,
    }).returning();

    return NextResponse.json(newPermission, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}