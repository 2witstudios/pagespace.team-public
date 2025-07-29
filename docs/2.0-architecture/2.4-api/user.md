# User Routes

### GET /api/users/find

**Purpose:** Finds a user by email.
**Auth Required:** Yes
**Request Schema:**
- email: string (query parameter)
**Response Schema:** User object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13