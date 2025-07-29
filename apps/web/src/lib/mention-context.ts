import { db, eq, and } from '@pagespace/db';
import { pages, chatMessages, channelMessages } from '@pagespace/db';
import { getUserAccessLevel } from '@pagespace/lib/client';
import type { Page } from '@pagespace/lib/client';

interface MentionContext {
  id: string;
  type: string;
  content: string;
  label: string;
}

export async function extractMentionContexts(
  content: string | string[],
  userId: string
): Promise<string> {
  console.log('[extractMentionContexts] Processing content:', content);
  const mentionContexts: MentionContext[] = [];
  
  // Extract all mentions from content
  const mentions = extractMentions(content);
  console.log('[extractMentionContexts] Extracted mentions:', mentions);
  
  for (const mention of mentions) {
    console.log('[extractMentionContexts] Processing mention:', mention);
    const context = await getMentionContext(mention, userId);
    if (context) {
      console.log('[extractMentionContexts] Got context for mention:', mention.label, 'Content length:', context.content.length);
      mentionContexts.push(context);
    } else {
      console.log('[extractMentionContexts] No context found for mention:', mention.label);
    }
  }
  
  if (mentionContexts.length === 0) {
    return '';
  }
  
  // Format contexts for AI
  return mentionContexts.map(ctx => {
    switch (ctx.type) {
      case 'page':
        return `Page "${ctx.label}":\n${ctx.content}`;
      case 'ai-page':
        return `AI Chat "${ctx.label}":\n${ctx.content}`;
      case 'ai-assistant':
        return `Assistant Conversation "${ctx.label}":\n${ctx.content}`;
      case 'channel':
        return `Channel "${ctx.label}":\n${ctx.content}`;
      case 'user':
        return `User "${ctx.label}" was mentioned`;
      default:
        return `"${ctx.label}":\n${ctx.content}`;
    }
  }).join('\n\n');
}

function extractMentions(content: string | string[]): Array<{id: string, type: string, label: string, data?: Record<string, unknown>}> {
  const mentions: Array<{id: string, type: string, label: string, data?: Record<string, unknown>}> = [];
  
  const lines = Array.isArray(content) ? content : [content];
  
  for (const line of lines) {
    if (typeof line === 'string') {
      // Extract HTML mentions first (from TipTap documents)
      mentions.push(...extractHtmlMentions(line));
      
      // Then extract markdown mentions (from text inputs)
      mentions.push(...extractMarkdownMentions(line));
    }
  }
  
  return mentions;
}

function extractHtmlMentions(content: string): Array<{id: string, type: string, label: string, data?: Record<string, unknown>}> {
  console.log('[extractHtmlMentions] Processing content:', content);
  const mentions: Array<{id: string, type: string, label: string, data?: Record<string, unknown>}> = [];
  
  // Regex to match TipTap mention HTML: <a class="mention" data-page-id="id" ...>@label</a>
  const htmlMentionRegex = /<a[^>]*class="[^"]*mention[^"]*"[^>]*data-page-id="([^"]+)"[^>]*>@([^<]+)<\/a>/g;
  
  let match: RegExpExecArray | null;
  while ((match = htmlMentionRegex.exec(content)) !== null) {
    const pageId = match[1];
    const label = match[2];
    
    console.log('[extractHtmlMentions] Found HTML mention - pageId:', pageId, 'label:', label);
    
    mentions.push({
      id: pageId,
      type: 'page', // TipTap mentions are currently page-only, could be extended
      label: label,
      data: { format: 'html' },
    });
  }
  
  console.log('[extractHtmlMentions] Total HTML mentions found:', mentions.length);
  return mentions;
}

function extractMarkdownMentions(content: string): Array<{id: string, type: string, label: string, data?: Record<string, unknown>}> {
  const mentions: Array<{id: string, type: string, label: string, data?: Record<string, unknown>}> = [];
  
  // Regex for markdown-typed format: @[label](id:type)
  const markdownTypedRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
  
  // Regex for simple format: @page title (alphanumeric with spaces, word boundaries)
  const simpleMentionRegex = /@([a-zA-Z0-9]+(?:\s+[a-zA-Z0-9]+)*)(?=\s|$|[.,!?;:])/g;
  
  // First, extract markdown-typed mentions (these have full context)
  let match: RegExpExecArray | null;
  while ((match = markdownTypedRegex.exec(content)) !== null) {
    mentions.push({
      id: match[2],
      type: match[3],
      label: match[1],
      data: { format: 'markdown' },
    });
  }
  
  // Then extract simple mentions, but skip positions already covered by markdown-typed mentions
  const coveredRanges: Array<{start: number, end: number}> = [];
  markdownTypedRegex.lastIndex = 0; // Reset regex
  while ((match = markdownTypedRegex.exec(content)) !== null) {
    coveredRanges.push({ start: match.index, end: match.index + match[0].length });
  }
  
  // Extract simple mentions that don't overlap with markdown-typed ones
  simpleMentionRegex.lastIndex = 0; // Reset regex
  while ((match = simpleMentionRegex.exec(content)) !== null) {
    const isOverlapping = coveredRanges.some(range => 
      match!.index >= range.start && match!.index < range.end
    );
    
    if (!isOverlapping) {
      // For simple mentions, we need to resolve the ID and type
      mentions.push({
        id: '', // Will be resolved later
        type: 'page', // Default assumption, will be refined during resolution
        label: match[1],
        data: { needsResolution: true, format: 'simple' },
      });
    }
  }
  
  return mentions;
}

async function resolveMentionByLabel(
  label: string, 
  userId: string
): Promise<{id: string, type: string} | null> {
  try {
    console.log('[resolveMentionByLabel] Resolving mention with label:', label);
    // Search for pages with matching title that the user has access to
    const matchingPages = await db.query.pages.findMany({
      where: and(
        eq(pages.title, label),
        eq(pages.isTrashed, false)
      ),
      limit: 5 // Limit to avoid too many matches
    });

    console.log('[resolveMentionByLabel] Found', matchingPages.length, 'matching pages for label:', label);
    if (matchingPages.length === 0) return null;

    // Check access level for each page and return the first accessible one
    for (const page of matchingPages) {
      const accessLevel = await getUserAccessLevel(userId, page.id);
      if (accessLevel) {
        // Map page type to mention type
        let mentionType = 'page';
        switch (page.type) {
          case 'AI_CHAT':
            mentionType = 'ai-page';
            break;
          case 'CHANNEL':
            mentionType = 'channel';
            break;
          case 'DOCUMENT':
          case 'VIBE':
          case 'FOLDER':
          default:
            mentionType = 'page';
            break;
        }
        
        return {
          id: page.id,
          type: mentionType
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error resolving mention by label:', error);
    return null;
  }
}

async function getMentionContext(
  mention: {id: string, type: string, label: string, data?: Record<string, unknown>},
  userId: string
): Promise<MentionContext | null> {
  // If this mention needs resolution (simple @username format), resolve it first
  if (mention.data?.needsResolution) {
    const resolvedMention = await resolveMentionByLabel(mention.label, userId);
    if (!resolvedMention) return null;
    
    // Update the mention object with resolved data
    mention.id = resolvedMention.id;
    mention.type = resolvedMention.type;
  }

  const accessLevel = await getUserAccessLevel(userId, mention.id);
  if (!accessLevel) return null;

  const page = await db.query.pages.findFirst({
    where: eq(pages.id, mention.id),
  });

  if (!page || page.isTrashed) return null;

  const content = await getPageContent(page as Page);

  return {
    id: mention.id,
    type: mention.type,
    content,
    label: mention.label,
  };
}

async function getPageContent(page: Page): Promise<string> {
  switch (page.type) {
    case 'DOCUMENT':
    case 'VIBE':
      return page.content || '';
    case 'AI_CHAT':
      const messages = await db.query.chatMessages.findMany({
        where: and(eq(chatMessages.pageId, page.id), eq(chatMessages.isActive, true)),
        orderBy: chatMessages.createdAt,
        limit: 10,
        with: { user: true },
      });
      return messages.map(msg => `${msg.user?.name || 'User'}: ${msg.content}`).join('\n');
    case 'CHANNEL':
      const channelMessagesResult = await db.query.channelMessages.findMany({
        where: eq(channelMessages.pageId, page.id),
        orderBy: channelMessages.createdAt,
        limit: 10,
        with: { user: true },
      });
      return channelMessagesResult.map(msg => `${msg.user?.name || 'User'}: ${msg.content}`).join('\n');
    case 'FOLDER':
      const children = await db.query.pages.findMany({
        where: and(eq(pages.parentId, page.id), eq(pages.isTrashed, false)),
      });
      return `Folder contains: ${children.map(c => c.title).join(', ')}`;
    default:
      return '';
  }
}