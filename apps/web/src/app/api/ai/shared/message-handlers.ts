import { db, and, eq, gte } from '@pagespace/db';
import { chatMessages, assistantMessages } from '@pagespace/db';
import { createId } from '@paralleldrive/cuid2';

/**
 * Handle message editing for page AI chats
 * Marks messages as inactive from a specific timestamp onwards
 */
export async function handlePageChatEdit(pageId: string, editedMessageCreatedAt: string) {
  await db.update(chatMessages).set({ 
    isActive: false, 
    editedAt: new Date() 
  }).where(
    and(
      eq(chatMessages.pageId, pageId), 
      gte(chatMessages.createdAt, new Date(editedMessageCreatedAt))
    )
  );
}

/**
 * Handle message regeneration for page AI chats
 * Marks messages as inactive from a specific timestamp onwards
 */
export async function handlePageChatRegenerate(pageId: string, regeneratedMessageCreatedAt: string) {
  await db.update(chatMessages).set({ 
    isActive: false, 
    editedAt: new Date() 
  }).where(
    and(
      eq(chatMessages.pageId, pageId), 
      gte(chatMessages.createdAt, new Date(regeneratedMessageCreatedAt))
    )
  );
}

/**
 * Handle message editing for assistant AI conversations
 * Marks messages as inactive from a specific timestamp onwards
 */
export async function handleAssistantEdit(conversationId: string, editedMessageCreatedAt: string) {
  await db.update(assistantMessages).set({
    isActive: false,
    editedAt: new Date(),
  }).where(
    and(
      eq(assistantMessages.conversationId, conversationId),
      gte(assistantMessages.createdAt, new Date(editedMessageCreatedAt))
    )
  );
}

/**
 * Handle message regeneration for assistant AI conversations
 * Marks messages as inactive from a specific timestamp onwards
 */
export async function handleAssistantRegenerate(conversationId: string, regeneratedMessageCreatedAt: string) {
  await db.update(assistantMessages).set({
    isActive: false,
    editedAt: new Date(),
  }).where(
    and(
      eq(assistantMessages.conversationId, conversationId),
      gte(assistantMessages.createdAt, new Date(regeneratedMessageCreatedAt))
    )
  );
}

/**
 * Save page AI chat messages atomically
 * Uses transaction to ensure both user and assistant messages are saved together
 */
export async function savePageChatMessages(params: {
  pageId: string;
  userId: string;
  userContent: string;
  assistantContent: string;
  toolCalls?: unknown;
  toolResults?: unknown;
}) {
  await db.transaction(async (tx) => {
    await tx.insert(chatMessages).values({
      id: createId(),
      pageId: params.pageId,
      userId: params.userId,
      role: 'user',
      content: params.userContent,
      isActive: true,
      createdAt: new Date(),
    });

    await tx.insert(chatMessages).values({
      id: createId(),
      pageId: params.pageId,
      role: 'assistant',
      content: params.assistantContent,
      toolCalls: params.toolCalls,
      toolResults: params.toolResults,
      isActive: true,
      createdAt: new Date(),
    });
  });
}

/**
 * Save assistant AI messages atomically
 * Uses transaction to ensure both user and assistant messages are saved together
 */
export async function saveAssistantMessages(params: {
  conversationId: string;
  userContent: string;
  assistantContent: string;
  toolCalls?: unknown;
  toolResults?: unknown;
}) {
  await db.transaction(async (tx) => {
    await tx.insert(assistantMessages).values([
      {
        conversationId: params.conversationId,
        role: 'user',
        content: params.userContent,
        isActive: true,
        createdAt: new Date(),
      },
      {
        conversationId: params.conversationId,
        role: 'assistant',
        content: params.assistantContent,
        toolCalls: params.toolCalls,
        toolResults: params.toolResults,
        isActive: true,
        createdAt: new Date(),
      }
    ]);
  });
}