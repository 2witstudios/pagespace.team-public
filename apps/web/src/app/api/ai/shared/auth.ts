import { NextResponse } from 'next/server';
import { decodeToken, getUserAccessLevel, permissionPrecedence, PermissionAction } from '@pagespace/lib/server';
import { db, users, eq } from '@pagespace/db';
import { parse } from 'cookie';

/**
 * Standard authentication flow for AI routes
 * Extracted from existing working AI routes
 */
export async function authenticateRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const decoded = await decodeToken(accessToken);
  if (!decoded) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, decoded.userId),
  });

  if (!user) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  return { userId: decoded.userId };
}

/**
 * Check page-specific permissions for page AI routes
 * Used by page-ai endpoints that need page-level access control
 */
export async function checkPagePermissions(userId: string, pageId: string, requiredPermission: PermissionAction = PermissionAction.EDIT) {
  const accessLevel = await getUserAccessLevel(userId, pageId);
  if (!accessLevel) {
    return { error: new NextResponse("Forbidden", { status: 403 }) };
  }

  const requiredLevel = permissionPrecedence.indexOf(requiredPermission);
  const userLevel = permissionPrecedence.indexOf(accessLevel);

  if (userLevel < requiredLevel) {
    return { error: new NextResponse(`Forbidden: You need ${requiredPermission} access.`, { status: 403 }) };
  }

  return { accessLevel };
}