import * as cheerio from 'cheerio';

interface MentionLink {
  pageId: string;
  href: string;
  text: string;
}

function extractMentionLinks(html: string): Map<string, MentionLink> {
  const $ = cheerio.load(html);
  const mentions = new Map<string, MentionLink>();

  $('a[data-mention-type="page"]').each((_, el) => {
    const element = $(el);
    const pageId = element.attr('data-page-id');
    const href = element.attr('href');
    const text = element.text();

    if (pageId && href) {
      mentions.set(pageId, { pageId, href, text });
    }
  });

  return mentions;
}

export function validateAiDiff(originalContent: string, newContent: string): boolean {
  const originalMentions = extractMentionLinks(originalContent);
  const newMentions = extractMentionLinks(newContent);

  for (const [pageId, originalMention] of originalMentions.entries()) {
    const newMention = newMentions.get(pageId);

    if (!newMention) {
      console.warn(`AI diff validation failed: Mention for pageId ${pageId} was removed.`);
      return false;
    }

    if (newMention.href !== originalMention.href) {
      console.warn(`AI diff validation failed: Mention href for pageId ${pageId} was changed.`);
      return false;
    }
  }

  return true;
}