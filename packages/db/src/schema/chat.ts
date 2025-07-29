import { pgTable, text, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { pages, drives } from './core';
import { createId } from '@paralleldrive/cuid2';

export const channelMessages = pgTable('channel_messages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  content: text('content').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  pageId: text('pageId').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => {
    return {
        pageIdx: index('channel_messages_page_id_idx').on(table.pageId),
    }
});

export const assistantConversations = pgTable('assistant_conversations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  model: text('model').notNull(),
  providerOverride: text('providerOverride'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().$onUpdate(() => new Date()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  driveId: text('driveId').notNull().references(() => drives.id, { onDelete: 'cascade' }),
}, (table) => {
    return {
        userIdx: index('assistant_conversations_user_id_idx').on(table.userId),
        driveIdx: index('assistant_conversations_drive_id_idx').on(table.driveId),
    }
});

export const assistantMessages = pgTable('assistant_messages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  role: text('role').notNull(),
  content: text('content').notNull(),
  toolCalls: jsonb('toolCalls'),
  toolResults: jsonb('toolResults'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  editedAt: timestamp('editedAt', { mode: 'date' }),
  toolCallActioned: boolean('toolCallActioned').default(false).notNull(),
  conversationId: text('conversationId').notNull().references(() => assistantConversations.id, { onDelete: 'cascade' }),
}, (table) => {
    return {
        conversationIdx: index('assistant_messages_conversation_id_idx').on(table.conversationId),
        conversationIsActiveCreatedAtIndex: index('assistant_messages_conversation_id_is_active_created_at_idx').on(table.conversationId, table.isActive, table.createdAt),
    }
});

export const channelMessagesRelations = relations(channelMessages, ({ one }) => ({
    page: one(pages, {
        fields: [channelMessages.pageId],
        references: [pages.id],
    }),
    user: one(users, {
        fields: [channelMessages.userId],
        references: [users.id],
    }),
}));

export const assistantConversationsRelations = relations(assistantConversations, ({ one, many }) => ({
    user: one(users, {
        fields: [assistantConversations.userId],
        references: [users.id],
    }),
    drive: one(drives, {
        fields: [assistantConversations.driveId],
        references: [drives.id],
    }),
    messages: many(assistantMessages),
}));

export const assistantMessagesRelations = relations(assistantMessages, ({ one }) => ({
    conversation: one(assistantConversations, {
        fields: [assistantMessages.conversationId],
        references: [assistantConversations.id],
    }),
}));

