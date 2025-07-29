# AI Architecture

The AI architecture in pagespace is designed to be flexible and extensible. It supports multiple AI providers and models, and is built on a foundation of a few core tables.

## `ai_chats`

This table stores the settings for an AI chat associated with a page.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Unique identifier for the AI chat. |
| `pageId` | `text` | The ID of the page the chat is associated with. |
| `model` | `text` | The AI model used for the chat. |
| `temperature` | `real` | The temperature setting for the AI model. |
| `systemPrompt` | `text` | The system prompt for the AI model. |
| `providerOverride` | `text` | A provider override for the AI model. |

## `user_ai_settings`

This table stores the AI settings for a user.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Unique identifier for the user's AI settings. |
| `userId` | `text` | The ID of the user. |
| `provider` | `text` | The AI provider the user has selected. |
| `encryptedApiKey` | `text` | The user's encrypted API key for the selected provider. |
| `baseUrl` | `text` | The user's Base URL for the selected provider. |