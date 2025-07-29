# Auth Routes

### POST /api/auth/login

**Purpose:** Authenticates a user and issues access and refresh tokens.
**Auth Required:** No
**Request Schema:**
- email: string (email format)
- password: string
**Response Schema:** User object on success, error object on failure.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/auth/logout

**Purpose:** Logs out a user by invalidating their refresh token and clearing cookies.
**Auth Required:** No (handles token check internally)
**Request Schema:** None
**Response Schema:** Message object
**Status Codes:** 200 (OK)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/auth/me

**Purpose:** Retrieves the currently authenticated user's details.
**Auth Required:** Yes
**Request Schema:** None
**Response Schema:** User object on success, error object on failure.
**Status Codes:** 200 (OK), 401 (Unauthorized)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/auth/refresh

**Purpose:** Refreshes access and refresh tokens using an existing refresh token.
**Auth Required:** No (uses refresh token from cookie)
**Request Schema:** None
**Response Schema:** Message object on success, error object on failure.
**Status Codes:** 200 (OK), 401 (Unauthorized)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/auth/signup

**Purpose:** Registers a new user and creates a personal drive for them.
**Auth Required:** No
**Request Schema:**
- name: string
- email: string (email format)
- password: string (min 8 characters)
**Response Schema:** Message object on success, error object on failure.
**Status Codes:** 201 (Created), 400 (Bad Request), 409 (Conflict), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13