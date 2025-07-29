import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { chatMessages } from './core';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  tokenVersion: integer('tokenVersion').default(0).notNull(),
  lastUsedAiModel: text('lastUsedAiModel'),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').unique().notNull(),
  device: text('device'),
  ip: text('ip'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('refresh_tokens_user_id_idx').on(table.userId),
  };
});

import { userAiSettings } from './ai';

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  chatMessages: many(chatMessages),
  aiSettings: many(userAiSettings),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));