# Channel Routes

### GET /api/channels/[pageId]/messages

**Purpose:** Fetches all messages for a specific channel page.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
**Response Schema:** Array of channel message objects with user details.
**Status Codes:** 200 (OK), 401 (Unauthorized)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/channels/[pageId]/messages

**Purpose:** Sends a new message to a specific channel page.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
- content: string
**Response Schema:** Newly created channel message object with user details.
**Status Codes:** 201 (Created), 401 (Unauthorized)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13