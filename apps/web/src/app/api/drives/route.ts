import { NextResponse } from 'next/server';
import { decodeToken, slugify, getUserGroups } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { drives, pages, permissions, db, and, eq, inArray, not } from '@pagespace/db';

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie');
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
    // 1. Get user's own drives
    const ownedDrives = await db.query.drives.findMany({
      where: eq(drives.ownerId, userId),
    });

    // 2. Get user's groups
    const groupIds = await getUserGroups(userId);
    const subjectIds = [userId, ...groupIds];

    // 3. Find pages shared with the user or their groups
    const permittedDrivesQuery = await db.selectDistinct({ driveId: pages.driveId })
      .from(permissions)
      .leftJoin(pages, eq(permissions.pageId, pages.id))
      .where(inArray(permissions.subjectId, subjectIds));

    // 4. Get the unique drive IDs from the shared pages
    const sharedDriveIds = permittedDrivesQuery.map(p => p.driveId).filter(Boolean) as string[];

    // 5. Fetch the actual drive objects, excluding ones the user already owns
    const sharedDrives = sharedDriveIds.length > 0 ? await db.query.drives.findMany({
      where: and(
        inArray(drives.id, sharedDriveIds),
        not(eq(drives.ownerId, userId))
      ),
    }) : [];

    // 6. Combine and add the isOwned flag
    const allDrives = [
      ...ownedDrives.map((drive) => ({ ...drive, isOwned: true })),
      ...sharedDrives.map((drive) => ({ ...drive, isOwned: false })),
    ];

    // Deduplicate in case a drive is both owned and shared (shouldn't happen with current logic, but good practice)
    const uniqueDrives = Array.from(new Map(allDrives.map(d => [d.id, d])).values());

    return NextResponse.json(uniqueDrives);
  } catch (error) {
    console.error('Error fetching drives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drives' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }
    
    if (name.toLowerCase() === 'personal') {
        return NextResponse.json({ error: 'Cannot create a drive named "Personal".' }, { status: 400 });
    }

    const slug = slugify(name);

    const newDrive = await db.insert(drives).values({
      name,
      slug,
      ownerId: session.user.id,
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newDrive[0], { status: 201 });
  } catch (error) {
    console.error('Error creating drive:', error);
    return NextResponse.json({ error: 'Failed to create drive' }, { status: 500 });
  }
}