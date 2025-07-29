import { db, aiPrompts, and, eq, or } from '@pagespace/db';

function sanitize(content: string | undefined): string {
  if (!content) {
    return '';
  }
  // Basic sanitization to prevent prompt injection
  return content.replace(/{{/g, '').replace(/}}/g, '');
}

type PromptContext = {
  context: 'PAGE_AI' | 'ASSISTANT_AI';
  subContext?: 'WRITE' | 'ASK';
  pageType?: 'DOCUMENT' | 'VIBE' | 'CHANNEL' | 'DASHBOARD';
  pageTitle?: string;
  pageContent?: string;
  documentContent?: string;
  mentionedContent?: string;
};

export async function getSystemPrompt(promptContext: PromptContext): Promise<string> {
  const {
    context,
    subContext,
    pageType,
    pageTitle,
    pageContent,
    documentContent,
    mentionedContent,
  } = promptContext;

  const prompt = await db.query.aiPrompts.findFirst({
    where: and(
      eq(aiPrompts.context, context),
      subContext ? eq(aiPrompts.subContext, subContext) : undefined,
      pageType ? eq(aiPrompts.pageType, pageType) : undefined,
      eq(aiPrompts.isDefault, true)
    ),
    orderBy: (prompts, { desc }) => [desc(prompts.version)],
  });

  if (!prompt) {
    // Fallback to a generic prompt if no specific prompt is found
    return 'You are a helpful and friendly AI assistant. Answer the questions in a concise and accurate manner.';
  }

  let composedPrompt = prompt.content;

  // Replace placeholders with sanitized content
  composedPrompt = composedPrompt.replace('{{pageTitle}}', sanitize(pageTitle));
  composedPrompt = composedPrompt.replace('{{pageContent}}', sanitize(pageContent));
  composedPrompt = composedPrompt.replace('{{documentContent}}', sanitize(documentContent));
  composedPrompt = composedPrompt.replace('{{mentionedContent}}', sanitize(mentionedContent));

  return composedPrompt;
}