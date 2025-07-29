import { pgTable, text, timestamp, unique, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth';

export const userAiSettings = pgTable('user_ai_settings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'openai', 'anthropic', 'google', 'ollama'
  encryptedApiKey: text('encryptedApiKey'),
  baseUrl: text('baseUrl'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
  return {
    userProviderUnique: unique('user_provider_unique').on(table.userId, table.provider),
  }
});

export const userAiSettingsRelations = relations(userAiSettings, ({ one }) => ({
  user: one(users, {
    fields: [userAiSettings.userId],
    references: [users.id],
  }),
}));
export const aiPrompts = pgTable('ai_prompts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  content: text('content').notNull(),
  context: text('context').notNull(), // e.g., 'PAGE_AI', 'ASSISTANT_AI'
  subContext: text('subContext'), // e.g., 'WRITE', 'ASK'
  pageType: text('pageType'), // e.g., 'DOCUMENT', 'VIBE', 'CHANNEL'
  version: integer('version').default(1).notNull(),
  isDefault: boolean('isDefault').default(false).notNull(),
  createdBy: text('createdBy').references(() => users.id),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const aiPromptsRelations = relations(aiPrompts, ({ one }) => ({
  user: one(users, {
    fields: [aiPrompts.createdBy],
    references: [users.id],
  }),
}));