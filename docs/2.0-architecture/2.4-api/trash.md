# Trash Routes

### DELETE /api/trash/[pageId]

**Purpose:** Permanently deletes a trashed page and its children from the database.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13