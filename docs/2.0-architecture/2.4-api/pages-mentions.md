# Page & Mention Routes

### GET /api/mentions/search

**Purpose:** Searches for pages, users, and AI conversations to be used in mentions.
**Auth Required:** Yes
**Request Schema:**
- `q`: string (query parameter - search query)
- `driveId`: string (query parameter)
- `types`: string (comma-separated list of 'page', 'user', 'ai-page', 'ai-assistant', 'channel')
**Response Schema:** Array of `MentionSuggestion` objects.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-20

### POST /api/pages

**Purpose:** Creates a new page.
**Auth Required:** Yes
**Request Schema:**
- `title`: string
- `type`: "DOCUMENT" | "FOLDER" | "DATABASE" (deprecated) | "CHANNEL" | "AI_CHAT"
- `parentId`: string | null
- `driveSlug`: string
- `content`: any (optional)
**Response Schema:** Newly created page object with optional AI chat details.
**Status Codes:** 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/[pageId]

**Purpose:** Fetches details for a specific page.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string (dynamic parameter)
**Response Schema:** Page object with nested details.
**Status Codes:** 200 (OK), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### PATCH /api/pages/[pageId]

**Purpose:** Updates a page's title or content. The content can be a string array for `RichlineEditor`.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string (dynamic parameter)
- `title`: string (optional)
- `content`: any (optional)
**Response Schema:** Updated page object with nested details.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-20

### DELETE /api/pages/[pageId]

**Purpose:** Moves a page (and optionally its children) to trash.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string (dynamic parameter)
- `trash_children`: boolean (optional)
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/[pageId]/breadcrumbs

**Purpose:** Fetches the breadcrumbs (ancestor path) for a given page.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string (dynamic parameter)
**Response Schema:** Array of breadcrumb page objects.
**Status Codes:** 200 (OK), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/[pageId]/children

**Purpose:** Fetches the direct children pages of a given page.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string (dynamic parameter)
**Response Schema:** Array of child page objects.
**Status Codes:** 200 (OK), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/[pageId]/permissions

**Purpose:** Fetches all permissions for a specific page, including owner and enriched subject details.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string (dynamic parameter)
**Response Schema:** Object containing owner and permissions array.
**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/pages/[pageId]/permissions

**Purpose:** Creates a new permission for a page.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string (dynamic parameter)
- `subjectId`: string
- `subjectType`: "USER" | "GROUP"
- `action`: "VIEW" | "EDIT" | "SHARE" | "DELETE"
**Response Schema:** Newly created permission object.
**Status Codes:** 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### DELETE /api/pages/[pageId]/permissions/[permissionId]

**Purpose:** Revokes a specific permission from a page.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string (dynamic parameter)
- `permissionId`: string (dynamic parameter)
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/pages/[pageId]/restore

**Purpose:** Restores a trashed page (and its trashed children) from the trash.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string (dynamic parameter)
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### PATCH /api/pages/reorder

**Purpose:** Reorders a page by changing its parent and/or position.
**Auth Required:** Yes
**Request Schema:**
- `pageId`: string
- `newParentId`: string | null
- `newPosition`: number
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/search

**Purpose:** Searches for pages by title within a specific drive.
**Auth Required:** Yes
**Request Schema:**
- `q`: string (query parameter - search query)
- `driveId`: string (query parameter)
**Response Schema:** Array of simplified page objects.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

---

## Mentions Table

**Purpose:** The `mentions` table exists in the database schema (`packages/db/src/schema/core.ts`) and stores relationships between pages where one page mentions another. This is used for backlinking and contextual navigation.
**Location:** `packages/db/src/schema/core.ts`
**Last Updated:** 2025-07-25

## Mention Formats

**AI Assistant & Chat**: The AI assistant and chat interfaces use a typed markdown format to ensure the correct context is fetched for mentions.
- **Format:** `@[label](id:type)`
- **Example:** `@[My Document](123:page)`

When a mention is used, the system will fetch the content of the mentioned page and inject it into the AI's context. The content that is fetched depends on the type of page:
- **DOCUMENT, VIBE**: The content of the page.
- **AI_CHAT**: The last 10 messages from the chat.
- **CHANNEL**: The last 10 messages from the channel.
- **FOLDER**: A list of the files in the folder.

## Mention Formats

**AI Assistant & Chat**: The AI assistant and chat interfaces use a typed markdown format to ensure the correct context is fetched for mentions.
- **Format:** `@[label](id:type)`
- **Example:** `@[My Document](123:page)`