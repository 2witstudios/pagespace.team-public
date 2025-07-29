import { streamText, CoreMessage } from 'ai';
import { db, and, eq, gte } from '@pagespace/db';
import { assistantConversations, assistantMessages, users, pages } from '@pagespace/db';
import { z } from 'zod';
import { decodeToken } from '@pagespace/lib/server';
import { extractMentionContexts } from '@/lib/mention-context';
import { NextResponse } from 'next/server';
import { parse } from 'cookie';
import { resolveModel, createModelInstance, handleModelError } from '@/app/api/ai/shared/models';
import { getSystemPrompt } from '@pagespace/prompts';

export const maxDuration = 30;

const postSchema = z.object({
  assistantConversationId: z.string().optional().nullable(),
  driveId: z.string(),
  model: z.string(),
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      createdAt: z.string().datetime().optional(),
    })
  ),
  pageContext: z.object({
    pageId: z.string(),
    pageTitle: z.string(),
    pageContent: z.string().optional(),
  }),
  documentContent: z.string().optional(),
  assistantMode: z.enum(['write', 'ask']).optional(),
  isEdit: z.boolean().optional(),
  editedMessageCreatedAt: z.string().datetime().optional(),
  isRegenerate: z.boolean().optional(),
  regeneratedMessageCreatedAt: z.string().datetime().optional(),
});


export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    const {
      assistantConversationId,
      driveId,
      model,
      messages,
      pageContext,
      documentContent,
      assistantMode,
      isEdit,
      editedMessageCreatedAt,
      isRegenerate,
      regeneratedMessageCreatedAt,
    } = postSchema.parse(body);

    let conversationId = assistantConversationId;

    // If no conversation ID is provided, create a new one
    if (!conversationId) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      
      const getTitleFromMessage = (content: string): string => {
        return content.substring(0, 50) || 'New Conversation';
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      const modelToUse = user?.lastUsedAiModel || model;
      const [provider] = modelToUse.split(':');
      
      const newConversation = await db.insert(assistantConversations).values({
        userId,
        driveId,
        title: firstUserMessage ? getTitleFromMessage(firstUserMessage.content) : 'New Conversation',
        model: modelToUse,
        providerOverride: provider,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({ id: assistantConversations.id });
      conversationId = newConversation[0].id;
    }

    if (isEdit && editedMessageCreatedAt) {
      await db.update(assistantMessages).set({
        isActive: false,
        editedAt: new Date(),
      }).where(
        and(
          eq(assistantMessages.conversationId, conversationId!),
          gte(assistantMessages.createdAt, new Date(editedMessageCreatedAt))
        )
      );
    }

    if (isRegenerate && regeneratedMessageCreatedAt) {
      await db.update(assistantMessages).set({
        isActive: false,
        editedAt: new Date(),
      }).where(
        and(
          eq(assistantMessages.conversationId, conversationId!),
          gte(assistantMessages.createdAt, new Date(regeneratedMessageCreatedAt))
        )
      );
    }

    const lastUserMessage = messages[messages.length - 1];

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageContext.pageId),
    });

    // --- Enhanced Mention Processing Logic ---
    let mentionedContent = '';
    if (lastUserMessage.content) {
      try {
        mentionedContent = await extractMentionContexts(lastUserMessage.content, userId);
      } catch (error) {
        console.warn('Failed to extract mention contexts:', error);
        mentionedContent = '';
      }
    }
    // --- End of Mention Processing Logic ---

    const systemPrompt = await getSystemPrompt({
      context: 'ASSISTANT_AI',
      subContext: assistantMode?.toUpperCase() as 'WRITE' | 'ASK' | undefined,
      pageTitle: pageContext.pageTitle,
      pageContent: pageContext.pageContent,
      pageType: page?.type.toUpperCase() as 'DOCUMENT' | 'VIBE' | 'CHANNEL' | 'DASHBOARD' | undefined,
      documentContent,
      mentionedContent,
    });

    // Resolve the model and API key using the new unified system
    let modelInstance;
    try {
      const { apiKey, baseUrl } = await resolveModel(userId, model);
      modelInstance = createModelInstance(model, apiKey, baseUrl);
    } catch (error) {
      return handleModelError(error);
    }

    console.log("--- System Prompt ---");
    console.log(systemPrompt);
    console.log("--- Messages ---");
    console.log(JSON.stringify(messages, null, 2));

    const result = await streamText({
      model: modelInstance,
      system: systemPrompt,
      messages: messages as CoreMessage[],
      onFinish: async ({ text, toolCalls, toolResults }) => {
        // Use transaction to ensure both messages are saved atomically
        await db.transaction(async (tx) => {
          await tx.insert(assistantMessages).values([
            {
              conversationId: conversationId!,
              role: 'user',
              content: lastUserMessage.content,
              isActive: true,
              createdAt: new Date(),
            },
            {
              conversationId: conversationId!,
              role: 'assistant',
              content: text,
              toolCalls: toolCalls,
              toolResults: toolResults,
              isActive: true,
              createdAt: new Date(),
            }
          ]);
          await tx.update(users).set({ lastUsedAiModel: model }).where(eq(users.id, userId));
        });
      },
    });

    // Respond with the streaming response and the conversation ID
    const response = result.toDataStreamResponse();
    response.headers.set('X-Conversation-Id', conversationId);
    return response;

  } catch (error) {
    console.error('Error in AI assistant chat:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}