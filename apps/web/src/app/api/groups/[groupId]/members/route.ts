import { NextResponse } from 'next/server';
import { groups, groupMemberships, drives, db, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

async function checkGroupAccess(groupId: string, userId: string) {
    const result = await db.select({ ownerId: drives.ownerId })
        .from(groups)
        .innerJoin(drives, eq(groups.driveId, drives.id))
        .where(eq(groups.id, groupId))
        .limit(1);
    
    return result[0]?.ownerId === userId;
}

const postSchema = z.object({
    userId: z.string(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
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

  if (!(await checkGroupAccess(params.groupId, session.user.id))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

    try {
        const body = await request.json();
        const { userId } = postSchema.parse(body);

        const newMembership = await db.insert(groupMemberships).values({
            id: createId(),
            groupId: params.groupId,
            userId,
        }).returning();

        return NextResponse.json(newMembership, { status: 201 });
    } catch (error) {
        console.error('Error adding member to group:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }
}