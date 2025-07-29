import { streamText, CoreMessage } from 'ai';
import { db, dashboardAssistantConversations, dashboardAssistantMessages, users, eq, and, gte } from '@pagespace/db';
import { z } from 'zod';
import { decodeToken } from '@pagespace/lib/server';
import { NextResponse } from 'next/server';
import { parse } from 'cookie';
import { resolveModel, createModelInstance, handleModelError } from '@/app/api/ai/shared/models';
import { getSystemPrompt } from '@pagespace/prompts';

export const maxDuration = 30;

const postSchema = z.object({
  conversationId: z.string().optional().nullable(),
  model: z.string(),
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      createdAt: z.string().datetime().optional(),
    })
  ),
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
      conversationId: convId,
      model,
      messages,
      documentContent,
      isEdit,
      editedMessageCreatedAt,
      isRegenerate,
      regeneratedMessageCreatedAt,
    } = postSchema.parse(body);

    let conversationId = convId;

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

      const newConversation = await db.insert(dashboardAssistantConversations).values({
        userId,
        title: firstUserMessage ? getTitleFromMessage(firstUserMessage.content) : 'New Conversation',
        model: modelToUse,
        providerOverride: provider,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({ id: dashboardAssistantConversations.id });
      conversationId = newConversation[0].id;
    }

    if (isEdit && editedMessageCreatedAt) {
      await db.update(dashboardAssistantMessages).set({
        isActive: false,
        editedAt: new Date(),
      }).where(
        and(
          eq(dashboardAssistantMessages.conversationId, conversationId!),
          gte(dashboardAssistantMessages.createdAt, new Date(editedMessageCreatedAt))
        )
      );
    }

    if (isRegenerate && regeneratedMessageCreatedAt) {
      await db.update(dashboardAssistantMessages).set({
        isActive: false,
        editedAt: new Date(),
      }).where(
        and(
          eq(dashboardAssistantMessages.conversationId, conversationId!),
          gte(dashboardAssistantMessages.createdAt, new Date(regeneratedMessageCreatedAt))
        )
      );
    }

    const lastUserMessage = messages[messages.length - 1];

    const systemPrompt = await getSystemPrompt({
      context: 'ASSISTANT_AI',
      subContext: 'WRITE',
      pageType: 'DASHBOARD',
      pageTitle: 'Dashboard',
      documentContent,
    });

    let modelInstance;
    try {
      const { apiKey, baseUrl } = await resolveModel(userId, model);
      modelInstance = createModelInstance(model, apiKey, baseUrl);
    } catch (error) {
      return handleModelError(error);
    }

    const result = await streamText({
      model: modelInstance,
      system: systemPrompt,
      messages: messages as CoreMessage[],
      onFinish: async ({ text, toolCalls, toolResults }) => {
        await db.transaction(async (tx) => {
          await tx.insert(dashboardAssistantMessages).values([
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

    const response = result.toDataStreamResponse();
    response.headers.set('X-Conversation-Id', conversationId);
    return response;

  } catch (error) {
    console.error('Error in dashboard assistant chat:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}