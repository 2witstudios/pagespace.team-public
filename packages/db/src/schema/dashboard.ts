import { pgTable, text, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { createId } from '@paralleldrive/cuid2';

// --- User Dashboard Layout ---
export const userDashboards = pgTable('user_dashboards', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').default('').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().$onUpdate(() => new Date()),
});

export const userDashboardsRelations = relations(userDashboards, ({ one }) => ({
  user: one(users, {
    fields: [userDashboards.userId],
    references: [users.id],
  }),
}));

// --- Dashboard Assistant ---
export const dashboardAssistantConversations = pgTable('dashboard_assistant_conversations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  model: text('model').default('google:gemini-1.5-pro').notNull(),
  providerOverride: text('providerOverride'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().$onUpdate(() => new Date()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  userIdx: index('dashboard_assistant_conversations_user_id_idx').on(table.userId),
}));

export const dashboardAssistantMessages = pgTable('dashboard_assistant_messages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  role: text('role').notNull(),
  content: text('content').notNull(),
  toolCalls: jsonb('toolCalls'),
  toolResults: jsonb('toolResults'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  editedAt: timestamp('editedAt', { mode: 'date' }),
  toolCallActioned: boolean('toolCallActioned').default(false).notNull(),
  conversationId: text('conversationId').notNull().references(() => dashboardAssistantConversations.id, { onDelete: 'cascade' }),
}, (table) => ({
  conversationIdx: index('dashboard_assistant_messages_conversation_id_idx').on(table.conversationId),
}));

export const dashboardAssistantConversationsRelations = relations(dashboardAssistantConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [dashboardAssistantConversations.userId],
    references: [users.id],
  }),
  messages: many(dashboardAssistantMessages),
}));

export const dashboardAssistantMessagesRelations = relations(dashboardAssistantMessages, ({ one }) => ({
  conversation: one(dashboardAssistantConversations, {
    fields: [dashboardAssistantMessages.conversationId],
    references: [dashboardAssistantConversations.id],
  }),
}));