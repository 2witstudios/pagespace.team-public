import { streamText, tool } from 'ai';
import { db, and, eq, gte } from '@pagespace/db';
import { pages, chatMessages, aiChats, users } from '@pagespace/db';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { decodeToken, getUserAccessLevel, permissionPrecedence, PermissionAction } from '@pagespace/lib/server';
import { extractMentionContexts } from '@/lib/mention-context';
import { parse } from 'cookie';
import { createId } from '@paralleldrive/cuid2';
import { resolveModel, createModelInstance, handleModelError } from '@/app/api/ai/shared/models';
import { getSystemPrompt } from '@pagespace/prompts';

const postSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      createdAt: z.string().datetime().optional(),
    })
  ),
  isEdit: z.boolean().optional(),
  editedMessageCreatedAt: z.string().datetime().optional(),
  isRegenerate: z.boolean().optional(),
  regeneratedMessageCreatedAt: z.string().datetime().optional(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    
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
    const { messages, isEdit, editedMessageCreatedAt, isRegenerate, regeneratedMessageCreatedAt } = postSchema.parse(body);

    // Manual permission check inspired by withPageAuth
    const accessLevel = await getUserAccessLevel(userId, pageId);
    if (!accessLevel) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const requiredLevel = permissionPrecedence.indexOf(PermissionAction.EDIT);
    const userLevel = permissionPrecedence.indexOf(accessLevel);

    if (userLevel < requiredLevel) {
        return new NextResponse("Forbidden: You need EDIT access to use the chat.", { status: 403 });
    }
    // End permission check

    if (isEdit && editedMessageCreatedAt) {
        await db.update(chatMessages).set({ isActive: false, editedAt: new Date() }).where(and(eq(chatMessages.pageId, pageId), gte(chatMessages.createdAt, new Date(editedMessageCreatedAt))));
    }

    if (isRegenerate && regeneratedMessageCreatedAt) {
        await db.update(chatMessages).set({ isActive: false, editedAt: new Date() }).where(and(eq(chatMessages.pageId, pageId), gte(chatMessages.createdAt, new Date(regeneratedMessageCreatedAt))));
    }

    const page = await db.query.pages.findFirst({
        where: eq(pages.id, pageId),
    });

    const aiChat = await db.query.aiChats.findFirst({
        where: eq(aiChats.pageId, pageId),
    });

    if (!page) {
        return new NextResponse("Not Found", { status: 404 });
    }
    
    if (page.isTrashed) {
        return new NextResponse("Forbidden: Page is in trash.", { status: 403 });
    }

    const lastUserMessage = messages[messages.length - 1];

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

    // Get the model from the AI chat configuration
    const modelToUse = aiChat?.model;

    if (!modelToUse) {
      return NextResponse.json({ error: 'No model configured for this chat. Please select a model in settings.' }, { status: 400 });
    }
    
    let modelProvider;
    try {
        const { apiKey, baseUrl } = await resolveModel(userId, modelToUse);
        modelProvider = createModelInstance(modelToUse, apiKey, baseUrl);
    } catch (error) {
        return handleModelError(error);
    }

    const systemPrompt = await getSystemPrompt({
      context: 'PAGE_AI',
      mentionedContent,
    });

    const [provider] = modelToUse.split(':');

    const result = await streamText({
      model: modelProvider,
      system: systemPrompt,
      messages: messages,
      temperature: aiChat?.temperature || 0.7,
      // Conditionally add tools only if the provider is not Ollama
      ...provider !== 'ollama' && {
        tools: {
          getWeather: tool({
            description: 'Get the weather in a location',
            parameters: z.object({
              location: z.string().describe('The location to get the weather for'),
            }),
            execute: async ({ location }) => {
              // Simulate fetching weather data
              const temperature = Math.round(Math.random() * (90 - 32) + 32);
              return {
                location,
                temperature,
                message: `The weather in ${location} is currently ${temperature}°F.`,
              };
            },
          }),
        },
      },
      onFinish: async ({ text, toolCalls, toolResults }) => {
        const lastUserMessage = messages[messages.length - 1];
        
        // Use transaction to ensure both messages are saved atomically
        await db.transaction(async (tx) => {
          await tx.insert(chatMessages).values({
              id: createId(),
              pageId,
              userId,
              role: 'user',
              content: lastUserMessage.content,
              isActive: true,
              createdAt: new Date(),
          });

          await tx.insert(chatMessages).values({
              id: createId(),
              pageId,
              role: 'assistant',
              content: text,
              toolCalls: toolCalls,
              toolResults: toolResults,
              isActive: true,
              createdAt: new Date(),
          });
          await tx.update(users).set({ lastUsedAiModel: modelToUse }).where(eq(users.id, userId));
        });
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in AI chat:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}