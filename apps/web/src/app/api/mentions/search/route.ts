import { NextResponse } from 'next/server';
import { decodeToken, getUserAccessLevel } from '@pagespace/lib/server';
import { parse } from 'cookie';
import { pages, users, assistantConversations, db, and, eq, ilike, drives, groups, groupMemberships, inArray } from '@pagespace/db';
import { MentionSuggestion, MentionType } from '@/types/mentions';

export async function GET(request: Request) {
  console.log('[API] /api/mentions/search - Request received');
  
  const cookieHeader = request.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    console.log('[API] No access token found');
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const decoded = await decodeToken(accessToken);
  if (!decoded) {
    console.log('[API] Failed to decode token');
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = decoded.userId;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const driveId = searchParams.get('driveId');
  const typesParam = searchParams.get('types'); // Comma-separated types
  
  console.log('[API] Search params - query:', query, 'driveId:', driveId, 'types:', typesParam);
  
  if (!driveId) {
    console.log('[API] Missing driveId parameter');
    return NextResponse.json(
      { error: 'Missing driveId parameter' },
      { status: 400 }
    );
  }

  // Parse requested mention types, default to all types
  const requestedTypes = typesParam 
    ? typesParam.split(',') as MentionType[]
    : ['page', 'user', 'ai-page', 'ai-assistant', 'channel'];

  try {
    const suggestions: MentionSuggestion[] = [];

    // Search pages (including ai-page and channels)
    if (requestedTypes.some(type => ['page', 'ai-page', 'channel'].includes(type))) {
      const pageResults = await db.select({
        id: pages.id,
        title: pages.title,
        type: pages.type,
      })
      .from(pages)
      .where(
        and(
          eq(pages.driveId, driveId),
          query ? ilike(pages.title, `%${query}%`) : undefined,
          eq(pages.isTrashed, false)
        )
      )
      .limit(10);

      // Filter by permissions and requested types
      for (const page of pageResults) {
        const accessLevel = await getUserAccessLevel(userId, page.id);
        if (!accessLevel) continue;

        let mentionType: MentionType;
        if (page.type === 'AI_CHAT' && requestedTypes.includes('ai-page')) {
          mentionType = 'ai-page';
        } else if (page.type === 'CHANNEL' && requestedTypes.includes('channel')) {
          mentionType = 'channel';
        } else if (['DOCUMENT', 'FOLDER', 'DATABASE'].includes(page.type) && requestedTypes.includes('page')) {
          mentionType = 'page';
        } else {
          continue; // Skip if type not requested
        }

        suggestions.push({
          id: page.id,
          label: page.title,
          type: mentionType,
          data: {
            pageType: page.type as 'DOCUMENT' | 'FOLDER' | 'DATABASE' | 'CHANNEL' | 'AI_CHAT',
            driveId: driveId,
          },
          description: `${page.type.toLowerCase()} in drive`,
        });
      }
    }

    // Search users (if user mentions are requested)
    if (requestedTypes.includes('user')) {
      // 1. Get the drive to identify the owner
      const driveResults = await db.select({ ownerId: drives.ownerId }).from(drives).where(eq(drives.id, driveId)).limit(1);
      const drive = driveResults[0];
      
      if (!drive) {
        // This should not happen if driveId is validated, but as a safeguard:
        return new NextResponse('Drive not found', { status: 404 });
      }

      // 2. Create a set of authorized user IDs, starting with the drive owner
      const authorizedUserIds = new Set<string>([drive.ownerId]);

      // 3. Find all groups within the drive
      const driveGroups = await db.select({ id: groups.id }).from(groups).where(eq(groups.driveId, driveId));

      // 4. If groups exist, find all their members and add them to the set
      if (driveGroups.length > 0) {
        const groupIds = driveGroups.map(g => g.id);
        const members = await db.select({ userId: groupMemberships.userId }).from(groupMemberships).where(inArray(groupMemberships.groupId, groupIds));
        members.forEach(m => authorizedUserIds.add(m.userId));
      }

      // 5. Search for users only within the authorized set and only by name
      const userResults = await db.select({
        id: users.id,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(
        and(
          inArray(users.id, Array.from(authorizedUserIds)),
          query ? ilike(users.name, `%${query}%`) : undefined
        )
      )
      .limit(5);

      // 6. Create suggestions without exposing email addresses
      for (const user of userResults) {
        suggestions.push({
          id: user.id,
          label: user.name || 'Unnamed User', // Fallback for users without a name
          type: 'user',
          data: {
            avatar: user.image || undefined,
          },
          description: 'User', // Generic, non-private description
        });
      }
    }

    // Search assistant conversations (if ai-assistant mentions are requested)
    if (requestedTypes.includes('ai-assistant')) {
      const conversationResults = await db.select({
        id: assistantConversations.id,
        title: assistantConversations.title,
        driveId: assistantConversations.driveId,
        createdAt: assistantConversations.createdAt,
        updatedAt: assistantConversations.updatedAt,
      })
      .from(assistantConversations)
      .where(
        and(
          eq(assistantConversations.driveId, driveId),
          eq(assistantConversations.userId, userId), // Only show user's own conversations
          query ? ilike(assistantConversations.title, `%${query}%`) : undefined
        )
      )
      .limit(5);

      for (const conversation of conversationResults) {
        suggestions.push({
          id: conversation.id,
          label: conversation.title,
          type: 'ai-assistant',
          data: {
            conversationId: conversation.id,
            title: conversation.title,
            driveId: conversation.driveId,
            messageCount: 0, // Could be calculated if needed
            lastActivity: conversation.updatedAt,
          },
          description: 'Assistant conversation',
        });
      }
    }

    // Sort suggestions by relevance (exact matches first, then alphabetical)
    suggestions.sort((a, b) => {
      const aExact = a.label.toLowerCase() === query.toLowerCase();
      const bExact = b.label.toLowerCase() === query.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.label.localeCompare(b.label);
    });

    const finalSuggestions = suggestions.slice(0, 10);
    console.log('[API] Returning', finalSuggestions.length, 'suggestions:', finalSuggestions);
    return NextResponse.json(finalSuggestions);
  } catch (error) {
    console.error('[MENTIONS_SEARCH_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}