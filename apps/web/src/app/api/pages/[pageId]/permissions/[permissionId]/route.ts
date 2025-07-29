import { NextResponse } from "next/server";
import { permissions, permissionAction, db, and, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { z } from "zod";

const updateSchema = z.object({
    action: z.enum(permissionAction.enumValues),
});

export async function PUT(req: Request, { params }: { params: Promise<{ pageId: string, permissionId: string }> }) {
  const { pageId, permissionId } = await params;
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
        const { action } = updateSchema.parse(body);

        const updatedPermission = await db.update(permissions).set({ action }).where(and(eq(permissions.id, permissionId), eq(permissions.pageId, pageId))).returning();

        return NextResponse.json(updatedPermission);
    } catch (error) {
        console.error('Error updating permission:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ pageId: string, permissionId: string }> }) {
  const { pageId, permissionId } = await params;
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
    // To be absolutely sure, we check that the permission is for the correct page
    const permission = await db.query.permissions.findFirst({
        where: and(eq(permissions.id, permissionId), eq(permissions.pageId, pageId)),
    });

    if (!permission) {
        return NextResponse.json({ error: 'Permission not found on this page' }, { status: 404 });
    }

    await db.delete(permissions).where(eq(permissions.id, permissionId));

    return NextResponse.json({ message: 'Permission revoked' });
  } catch (error) {
    console.error('Error revoking permission:', error);
    return NextResponse.json({ error: 'Failed to revoke permission' }, { status: 500 });
  }
}