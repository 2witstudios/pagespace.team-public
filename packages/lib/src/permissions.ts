import { db, and, eq, inArray, sql } from '@pagespace/db';
import { pages, drives, groups, groupMemberships, permissions } from '@pagespace/db';
import type { Page } from './types';
import { PageType, PermissionAction } from './enums';

/**
 * Fetches all group IDs for a given user.
 * @param userId - The ID of the user.
 * @param driveId - (Optional) The ID of the drive to scope the search to.
 * @returns A promise that resolves to an array of group IDs.
 */
export async function getUserGroups(userId: string, driveId?: string): Promise<string[]> {
  const query = db.select({ groupId: groupMemberships.groupId })
    .from(groupMemberships)
    .leftJoin(groups, eq(groupMemberships.groupId, groups.id))
    .where(
      and(
        eq(groupMemberships.userId, userId),
        driveId ? eq(groups.driveId, driveId) : undefined
      )
    );

  const memberships = await query;
  return memberships.map((m: any) => m.groupId);
}

/**
 * Fetches all ancestor page IDs for a given page, including the page itself.
 * The list is ordered from the page up to the root.
 * This is implemented using a recursive Common Table Expression (CTE) for efficiency.
 * @param pageId - The ID of the starting page.
 * @returns A promise that resolves to an array of page IDs.
 */
export async function getPageAncestors(pageId: string): Promise<string[]> {
  const { rows: result } = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, "parentId"
      FROM "Page"
      WHERE id = ${pageId}
      UNION ALL
      SELECT p.id, p."parentId"
      FROM "Page" p
      JOIN ancestors a ON p.id = a."parentId"
    )
    SELECT id FROM ancestors;
  `);
  return (result as { id: string }[]).map((r) => r.id);
}

/**
 * Finds all permissions for a given set of pages and subjects.
 * @param pageIds - An array of page IDs to check for permissions.
 * @param subjectIds - An array of subject IDs (can be user IDs and group IDs).
 * @returns A promise that resolves to an array of Permission objects.
 */
export async function findPermissions(
  pageIds: string[],
  subjectIds: string[]
): Promise<{ action: PermissionAction }[]> {
  if (pageIds.length === 0 || subjectIds.length === 0) {
    return [];
  }

  const result = await db.select({ action: permissions.action })
    .from(permissions)
    .where(
      and(
        inArray(permissions.pageId, pageIds),
        inArray(permissions.subjectId, subjectIds)
      )
    );
  
  return result.map(r => ({ action: r.action as PermissionAction }));
}

export const permissionPrecedence: PermissionAction[] = [
  PermissionAction.VIEW,
  PermissionAction.EDIT,
  PermissionAction.SHARE,
  PermissionAction.DELETE,
];

/**
 * Resolves the highest permission level from a list of permissions based on a defined precedence.
 * The order of precedence is DELETE > SHARE > EDIT > VIEW.
 * @param permissions - An array of Permission objects.
 * @returns The highest PermissionAction, or null if no permissions are provided.
 */
export function resolveHighestPermission(
  permissions: { action: PermissionAction }[]
): PermissionAction | null {
  if (permissions.length === 0) {
    return null;
  }

  let highestPermission: PermissionAction | null = null;
  let highestPrecedence = -1;

  for (const permission of permissions) {
    const precedence = permissionPrecedence.indexOf(permission.action);
    if (precedence > highestPrecedence) {
      highestPrecedence = precedence;
      highestPermission = permission.action;
    }
  }

  return highestPermission;
}

/**
 * The main authorization function.
 * Determines a user's access level for a given page by checking for drive ownership,
 * direct permissions, and inherited permissions from ancestor pages.
 * @param userId - The ID of the user.
 * @param pageId - The ID of the page to check.
 * @returns A promise that resolves to the highest PermissionAction the user has, or null if they have no access.
 */
export async function getUserAccessLevel(
  userId: string,
  pageId: string
): Promise<PermissionAction | null> {
  // 1. Check if the user is the owner of the parent Drive.
  const pageResult = await db.select({
    driveId: pages.driveId,
    driveOwnerId: drives.ownerId
  })
  .from(pages)
  .leftJoin(drives, eq(pages.driveId, drives.id))
  .where(eq(pages.id, pageId))
  .limit(1);

  const page = pageResult[0];

  if (!page) {
    return null; // Page not found
  }

  if (page.driveOwnerId === userId) {
    return PermissionAction.DELETE; // Owner has the highest level of permission
  }

  // 2. Find all groups the user is a member of for the current drive.
  const userGroups = await getUserGroups(userId, page.driveId);
  const subjectIds = [userId, ...userGroups];

  // 3. Recursively traverse up the page tree.
  const pageAncestors = await getPageAncestors(pageId);

  // 4. Find all permissions that apply to the user or their groups on the page or its ancestors.
  const userPermissions = await findPermissions(pageAncestors, subjectIds);

  // 5. The highest-privilege permission found is the one that applies.
  return resolveHighestPermission(userPermissions);
}

/**
 * Efficiently determines a user's access level for multiple pages.
 * @param userId The ID of the user.
 * @param pageIds An array of page IDs to check.
 * @returns A promise that resolves to a Map where keys are accessible page IDs
 *          and values are the user's highest PermissionAction for that page.
 */
export async function getUserAccessiblePages(
  userId: string,
  pageIds: string[]
): Promise<Map<string, Page>> {
  const accessiblePages = new Map<string, Page>();

  if (!pageIds || pageIds.length === 0) {
    return accessiblePages;
  }

  // 1. Fetch all pages at once to get their drive info
  const pageResults = await db.select().from(pages)
  .leftJoin(drives, eq(pages.driveId, drives.id))
  .where(inArray(pages.id, pageIds));

  // 2. Group pages by driveId
  const pagesByDrive: Record<string, typeof pageResults> = pageResults.reduce((acc: any, page: any) => {
    if (page.pages.driveId) {
      if (!acc[page.pages.driveId]) {
        acc[page.pages.driveId] = [];
      }
      acc[page.pages.driveId].push(page);
    }
    return acc;
  }, {} as Record<string, typeof pageResults>);

  // 3. Process each drive's pages
  for (const driveId in pagesByDrive) {
    const drivePages = pagesByDrive[driveId];
    const driveOwnerId = drivePages[0]?.drives?.ownerId;

    // Check for drive ownership first
    if (driveOwnerId === userId) {
      drivePages.forEach((p: any) => {
        const page = { ...p.pages, type: p.pages.type as PageType, isOwned: true };
        accessiblePages.set(p.pages.id, page);
      });
      continue; // Skip to next drive if user is owner
    }

    // Get user groups for this drive
    const userGroups = await getUserGroups(userId, driveId);
    const subjectIds = [userId, ...userGroups];

    // Process each page in the drive
    for (const page of drivePages) {
      // Re-check ownership for sanity, though covered above
      if (page.drives?.ownerId === userId) {
        const p = { ...page.pages, type: page.pages.type as PageType, isOwned: true };
        accessiblePages.set(page.pages.id, p);
        continue;
      }

      const pageAncestors = await getPageAncestors(page.pages.id);
      const userPermissions = await findPermissions(pageAncestors, subjectIds);
      const accessLevel: PermissionAction | null = resolveHighestPermission(userPermissions);

      if (accessLevel) {
        const p = { ...page.pages, type: page.pages.type as PageType, accessLevel };
        accessiblePages.set(page.pages.id, p);
      }
    }
  }

  return accessiblePages;
}