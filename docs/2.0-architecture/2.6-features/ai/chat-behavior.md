# Chat Behavior

The chat system in pagespace is designed to be flexible and powerful. It's built on a few core tables that handle different types of chat.

## `chat_messages`

This table stores messages for AI chats that are associated with a page.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Unique identifier for the chat message. |
| `pageId` | `text` | The ID of the page the message is associated with. |
| `role` | `text` | The role of the message author (e.g., "user", "assistant"). |
| `content` | `text` | The content of the message. |
| `toolCalls` | `jsonb` | Any tool calls made by the assistant. |
| `toolResults` | `jsonb` | The results of any tool calls. |
| `createdAt` | `timestamp` | When the message was created. |
| `isActive` | `boolean` | Whether the message is active. |
| `editedAt` | `timestamp` | When the message was last edited. |
| `userId` | `text` | The ID of the user who sent the message. |

## `assistant_conversations` and `assistant_messages`

These tables store the conversations and messages for the global AI assistant.

### `assistant_conversations`

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Unique identifier for the conversation. |
| `title` | `text` | The title of the conversation. |
| `model` | `text` | The AI model used for the conversation. |
| `providerOverride` | `text` | A provider override for the AI model. |
| `createdAt` | `timestamp` | When the conversation was created. |
| `updatedAt` | `timestamp` | When the conversation was last updated. |
| `userId` | `text` | The ID of the user who started the conversation. |
| `driveId` | `text` | The ID of the drive the conversation is associated with. |

### `assistant_messages`

This table has the same structure as `chat_messages`, but is associated with an `assistant_conversations` instead of a page.