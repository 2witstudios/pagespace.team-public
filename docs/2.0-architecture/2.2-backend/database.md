# Database Schema

This document outlines the database schema for pagespace.

## Table: `users`

**Purpose:** Stores user account information and authentication data.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the user (CUID2).
-   `name`: `text` - The user's display name.
-   `email`: `text` (Unique) - The user's email address (used for authentication).
-   `emailVerified`: `timestamp` - When the user's email was verified (future use).
-   `image`: `text` - A URL for the user's profile image (optional).
-   `password`: `text` - The user's bcrypt-hashed password.
-   `tokenVersion`: `integer` (Default: 0) - Version number for JWT tokens. Incrementing this invalidates all existing tokens for security purposes.

**Authentication Notes:**
- Passwords are hashed using bcryptjs with secure salt rounds
- `tokenVersion` enables global session invalidation (e.g., on security breach)
- Email uniqueness is enforced at database level

## Table: `refresh_tokens`

**Purpose:** Stores one-time refresh tokens for secure session management with token rotation.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the refresh token (CUID2).
-   `userId`: `text` (Foreign Key to `users.id`) - The ID of the user the token belongs to.
-   `token`: `text` (Unique) - The JWT refresh token (deleted after use for security).
-   `device`: `text` - The device description from User-Agent header.
-   `ip`: `text` - The IP address where the token was issued.
-   `userAgent`: `text` - Full User-Agent string for device tracking.
-   `createdAt`: `timestamp` (Default: now) - When the token was created.

**Security Features:**
- One-time use tokens: deleted immediately after successful refresh
- Device and IP tracking for security monitoring
- Automatic cleanup on token version mismatch
- Cascading delete when user is removed

## Table: `drives`

**Purpose:** Stores information about drives.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the drive.
-   `name`: `text` - The name of the drive.
-   `slug`: `text` - The slug of the drive.
-   `ownerId`: `text` (Foreign Key to `users.id`) - The ID of the user who owns the drive.
-   `createdAt`: `timestamp` - When the drive was created.
-   `updatedAt`: `timestamp` - When the drive was last updated.

## Table: `pages`

**Purpose:** Stores the pages of content.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the page.
-   `title`: `text` - The title of the page.
-   `type`: `pageType` - The type of the page. Can be `FOLDER`, `DOCUMENT`, `DATABASE` (deprecated), `CHANNEL`, or `AI_CHAT`.
-   `content`: `jsonb` - The content of the page, stored as a JSONB object.
-   `position`: `real` - The position of the page within its parent.
-   `isTrashed`: `boolean` - Whether the page is in the trash.
-   `createdAt`: `timestamp` - When the page was created.
-   `updatedAt`: `timestamp` - When the page was last updated.
-   `trashedAt`: `timestamp` - When the page was trashed.
-   `driveId`: `text` (Foreign Key to `drives.id`) - The ID of the drive the page belongs to.
-   `parentId`: `text` (Foreign Key to `pages.id`) - The ID of the parent page.
-   `originalParentId`: `text` - The original parent ID of the page before it was trashed.

## Table: `chat_messages`

**Purpose:** Stores messages for AI chats that are associated with a page.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the chat message.
-   `pageId`: `text` (Foreign Key to `pages.id`) - The ID of the page the message is associated with.
-   `role`: `text` - The role of the message author (e.g., "user", "assistant").
-   `content`: `text` - The content of the message.
-   `toolCalls`: `jsonb` - Any tool calls made by the assistant.
-   `toolResults`: `jsonb` - The results of any tool calls.
-   `createdAt`: `timestamp` - When the message was created.
-   `isActive`: `boolean` - Whether the message is active.
-   `editedAt`: `timestamp` - When the message was last edited.
-   `userId`: `text` (Foreign Key to `users.id`) - The ID of the user who sent the message.

## Table: `ai_chats`

**Purpose:** Stores the settings for an AI chat associated with a page.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the AI chat.
-   `pageId`: `text` (Foreign Key to `pages.id`) - The ID of the page the chat is associated with.
-   `model`: `text` - The AI model used for the chat.
-   `temperature`: `real` - The temperature setting for the AI model.
-   `systemPrompt`: `text` - The system prompt for the AI model.
-   `providerOverride`: `text` - A provider override for the AI model.

## Table: `tags`

**Purpose:** Stores the tags themselves.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the tag.
-   `name`: `text` (Unique) - The name of the tag.
-   `color`: `text` - The color of the tag.

## Table: `page_tags`

**Purpose:** A join table that connects pages and tags.

**Columns:**

-   `pageId`: `text` (Foreign Key to `pages.id`) - The ID of the page.
-   `tagId`: `text` (Foreign Key to `tags.id`) - The ID of the tag.

## Table: `favorites`

**Purpose:** Stores user favorites.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the favorite.
-   `userId`: `text` (Foreign Key to `users.id`) - The ID of the user.
-   `pageId`: `text` (Foreign Key to `pages.id`) - The ID of the page.

## Table: `mentions`

**Purpose:** Stores mentions of other pages.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the mention.
-   `createdAt`: `timestamp` - When the mention was created.
-   `sourcePageId`: `text` (Foreign Key to `pages.id`) - The ID of the page where the mention was made.
-   `targetPageId`: `text` (Foreign Key to `pages.id`) - The ID of the page that was mentioned.

## Table: `groups`

**Purpose:** Stores user groups.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the group.
-   `name`: `text` - The name of the group.
-   `driveId`: `text` (Foreign Key to `drives.id`) - The ID of the drive the group belongs to.

## Table: `group_memberships`

**Purpose:** A join table that connects users and groups.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the group membership.
-   `userId`: `text` (Foreign Key to `users.id`) - The ID of the user.
-   `groupId`: `text` (Foreign Key to `groups.id`) - The ID of the group.

## Table: `permissions`

**Purpose:** Stores permissions for pages.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the permission.
-   `action`: `permissionAction` - The action the permission grants. Can be `VIEW`, `EDIT`, `SHARE`, or `DELETE`.
-   `subjectType`: `subjectType` - The type of subject the permission applies to. Can be `USER` or `GROUP`.
-   `subjectId`: `text` - The ID of the subject the permission applies to.
-   `pageId`: `text` (Foreign Key to `pages.id`) - The ID of the page the permission applies to.

## Table: `channel_messages`

**Purpose:** Stores messages for real-time chat channels.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the channel message.
-   `content`: `text` - The content of the message.
-   `createdAt`: `timestamp` - When the message was created.
-   `pageId`: `text` (Foreign Key to `pages.id`) - The ID of the page the message is associated with.
-   `userId`: `text` (Foreign Key to `users.id`) - The ID of the user who sent the message.

## Table: `assistant_conversations`

**Purpose:** Stores conversations with the global AI assistant.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the conversation.
-   `title`: `text` - The title of the conversation.
-   `model`: `text` - The AI model used for the conversation.
-   `providerOverride`: `text` - A provider override for the AI model.
-   `createdAt`: `timestamp` - When the conversation was created.
-   `updatedAt`: `timestamp` - When the conversation was last updated.
-   `userId`: `text` (Foreign Key to `users.id`) - The ID of the user who started the conversation.
-   `driveId`: `text` (Foreign Key to `drives.id`) - The ID of the drive the conversation is associated with.

## Table: `assistant_messages`

**Purpose:** Stores messages for the global AI assistant.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the message.
-   `role`: `text` - The role of the message author (e.g., "user", "assistant").
-   `content`: `text` - The content of the message.
-   `toolCalls`: `jsonb` - Any tool calls made by the assistant.
-   `toolResults`: `jsonb` - The results of any tool calls.
-   `createdAt`: `timestamp` - When the message was created.
-   `isActive`: `boolean` - Whether the message is active.
-   `editedAt`: `timestamp` - When the message was last edited.
-   `conversationId`: `text` (Foreign Key to `assistant_conversations.id`) - The ID of the conversation the message is associated with.

## Table: `user_ai_settings`

**Purpose:** Stores the AI settings for a user.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the user's AI settings.
-   `userId`: `text` (Foreign Key to `users.id`) - The ID of the user.
-   `provider`: `text` - The AI provider the user has selected.
-   `encryptedApiKey`: `text` - The user's encrypted API key for the selected provider.

## Table: `user_dashboards`

**Purpose:** Stores the custom layout for a user's personal dashboard.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the dashboard layout.
-   `userId`: `text` (Foreign Key to `users.id`) - The ID of the user.
-   `content`: `text` - The HTML content of the dashboard.
-   `createdAt`: `timestamp` - When the dashboard was created.
-   `updatedAt`: `timestamp` - When the dashboard was last updated.

## Table: `dashboard_assistant_conversations`

**Purpose:** Stores conversations with the dashboard AI assistant.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the conversation.
-   `title`: `text` - The title of the conversation.
-   `model`: `text` - The AI model used for the conversation.
-   `providerOverride`: `text` - A provider override for the AI model.
-   `createdAt`: `timestamp` - When the conversation was created.
-   `updatedAt`: `timestamp` - When the conversation was last updated.
-   `userId`: `text` (Foreign Key to `users.id`) - The ID of the user who started the conversation.

## Table: `dashboard_assistant_messages`

**Purpose:** Stores messages for the dashboard AI assistant.

**Columns:**

-   `id`: `text` (Primary Key) - Unique identifier for the message.
-   `role`: `text` - The role of the message author (e.g., "user", "assistant").
-   `content`: `text` - The content of the message.
-   `toolCalls`: `jsonb` - Any tool calls made by the assistant.
-   `toolResults`: `jsonb` - The results of any tool calls.
-   `createdAt`: `timestamp` - When the message was created.
-   `isActive`: `boolean` - Whether the message is active.
-   `editedAt`: `timestamp` - When the message was last edited.
-   `conversationId`: `text` (Foreign Key to `dashboard_assistant_conversations.id`) - The ID of the conversation the message is associated with.