import { NextResponse } from 'next/server';
import { groups, groupMemberships, drives, db, and, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';

async function checkGroupAccess(groupId: string, userId: string) {
    const result = await db.select({ ownerId: drives.ownerId })
        .from(groups)
        .innerJoin(drives, eq(groups.driveId, drives.id))
        .where(eq(groups.id, groupId))
        .limit(1);
    
    return result[0]?.ownerId === userId;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ groupId: string; userId: string }> }
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
        await db.delete(groupMemberships).where(and(
            eq(groupMemberships.userId, params.userId),
            eq(groupMemberships.groupId, params.groupId)
        ));

        return NextResponse.json({ message: 'Member removed from group' });
    } catch (error) {
        console.error('Error removing member from group:', error);
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }
}