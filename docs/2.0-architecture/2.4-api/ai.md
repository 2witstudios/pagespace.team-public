# AI Routes

### POST /api/ai/ai-page/messages/[pageId]

**Purpose:** Handles AI chat interactions for a specific AI Page. Messages are saved atomically using database transactions. It supports message editing and regeneration.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
- messages: array of CoreMessage objects
- isEdit: boolean (optional)
- editedMessageCreatedAt: string (datetime, optional)
- isRegenerate: boolean (optional)
- regeneratedMessageCreatedAt: string (datetime, optional)
**Response Schema:** Streaming response for chat, JSON for errors.
**Status Codes:** 200 (for stream), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### PATCH /api/ai/ai-page/settings/[pageId]

**Purpose:** Updates AI chat settings (model, temperature, system prompt) for a specific AI Page.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
- model: string (optional)
- temperature: number (optional)
- systemPrompt: string (optional)
- providerOverride: string (optional)
**Response Schema:** Updated AI chat object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-14

### GET /api/ai/ai-assistant/conversations

**Purpose:** Fetches a list of AI assistant conversations for a specific user and drive.
**Auth Required:** Yes
**Request Schema:**
- driveId: string (query parameter)
**Response Schema:** Array of conversation objects
- id: string
- title: string
- updatedAt: string (datetime)
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/ai/ai-assistant/conversations/[conversationId]

**Purpose:** Fetches all active messages within a specific AI assistant conversation.
**Auth Required:** Yes
**Request Schema:**
- conversationId: string (dynamic parameter)
**Response Schema:** Object containing messages
- messages: Array of message objects
**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/ai/ai-assistant/messages

**Purpose:** Handles AI assistant chat, including conversation management, message editing/regeneration, and page context.
**Auth Required:** Yes
**Request Schema:**
- assistantConversationId: string (optional, nullable)
- driveId: string
- model: string
- messages: array of CoreMessage objects
- pageContext: object with pageId, pageTitle, pageContent
- isEdit: boolean (optional)
- editedMessageCreatedAt: string (datetime, optional)
- isRegenerate: boolean (optional)
- regeneratedMessageCreatedAt: string (datetime, optional)
**Response Schema:** Streaming response for chat, JSON for errors. The conversation ID is returned in the `X-Conversation-Id` header.
**Status Codes:** 200 (for stream), 401 (Unauthorized), 400 (Bad Request), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/ai/ai-assistant/promote

**Purpose:** Promotes an AI assistant conversation to a permanent page (AI_CHAT type) within a drive.
**Auth Required:** Yes
**Request Schema:**
- assistantConversationId: string
- parentPageId: string (optional)
- driveId: string
**Response Schema:** Object containing new page details
- pageId: string
- driveSlug: string (optional)
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### PATCH /api/ai/settings/[chatId]

**Purpose:** Updates AI chat settings (model, temperature, system prompt) for a specific AI chat.
**Auth Required:** Yes
**Request Schema:**
- chatId: string (dynamic parameter)
- model: string (optional)
- temperature: number (optional)
- systemPrompt: string (optional)
**Response Schema:** Updated AI chat object.
**Status Codes:** 200 (OK), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### PATCH /api/ai/user-settings

**Purpose:** Creates or updates a user's AI provider setting. If `apiKey` is an empty string, the existing key will be removed.
**Auth Required:** Yes
**Request Schema:**
- provider: string
- apiKey: string (optional)
- isDefault: boolean (optional)
**Response Schema:** The updated setting object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-14

### DELETE /api/ai/user-settings

**Purpose:** Deletes a user's API key for a specific provider.
**Auth Required:** Yes
**Request Schema:**
- provider: string
**Response Schema:** The updated setting object without the API key.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-14