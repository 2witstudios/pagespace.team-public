import { pgTable, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { drives, pages } from './core';
import { createId } from '@paralleldrive/cuid2';
export const permissionAction = pgEnum('PermissionAction', ['VIEW', 'EDIT', 'SHARE', 'DELETE']);
export const subjectType = pgEnum('SubjectType', ['USER', 'GROUP']);

export const groups = pgTable('groups', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  driveId: text('driveId').notNull().references(() => drives.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().$onUpdate(() => new Date()),
}, (table) => {
    return {
        driveIdNameKey: index('groups_drive_id_name_key').on(table.driveId, table.name),
        driveIdx: index('groups_drive_id_idx').on(table.driveId),
    }
});

export const groupMemberships = pgTable('group_memberships', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupId: text('groupId').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
    return {
        userIdGroupIdKey: index('group_memberships_user_id_group_id_key').on(table.userId, table.groupId),
        userIdx: index('group_memberships_user_id_idx').on(table.userId),
        groupIdx: index('group_memberships_group_id_idx').on(table.groupId),
    }
});

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  action: permissionAction('action').notNull(),
  subjectType: subjectType('subjectType').notNull(),
  subjectId: text('subjectId').notNull(),
  pageId: text('pageId').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
    return {
        pageIdx: index('permissions_page_id_idx').on(table.pageId),
        subjectIdx: index('permissions_subject_id_subject_type_idx').on(table.subjectId, table.subjectType),
        pageSubjectIdx: index('permissions_page_id_subject_id_subject_type_idx').on(table.pageId, table.subjectId, table.subjectType),
    }
});

export const groupsRelations = relations(groups, ({ one, many }) => ({
    drive: one(drives, {
        fields: [groups.driveId],
        references: [drives.id],
    }),
    memberships: many(groupMemberships),
}));

export const groupMembershipsRelations = relations(groupMemberships, ({ one }) => ({
    user: one(users, {
        fields: [groupMemberships.userId],
        references: [users.id],
    }),
    group: one(groups, {
        fields: [groupMemberships.groupId],
        references: [groups.id],
    }),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
    page: one(pages, {
        fields: [permissions.pageId],
        references: [pages.id],
    }),
}));

// Note: pages.permissions relation would cause circular dependency, so handled through direct queries

