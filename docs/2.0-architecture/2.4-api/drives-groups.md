# Drive & Group Routes

### GET /api/drives

**Purpose:** Fetches all drives accessible by the authenticated user (owned and shared).
**Auth Required:** Yes
**Request Schema:** None
**Response Schema:** Array of drive objects, each with an `isOwned` boolean flag.
**Status Codes:** 200 (OK), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/drives

**Purpose:** Creates a new drive for the authenticated user.
**Auth Required:** Yes
**Request Schema:**
- name: string
**Response Schema:** Newly created drive object.
**Status Codes:** 201 (Created), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/drives/[driveSlug]/groups

**Purpose:** Fetches all groups associated with a specific drive by slug.
**Auth Required:** Yes
**Request Schema:**
- driveSlug: string (dynamic parameter)
**Response Schema:** Array of group objects.
**Status Codes:** 200 (OK), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/drives/[driveSlug]/groups

**Purpose:** Creates a new group within a specific drive by slug.
**Auth Required:** Yes
**Request Schema:**
- driveSlug: string (dynamic parameter)
- name: string
**Response Schema:** Newly created group object.
**Status Codes:** 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### PATCH /api/drives/[driveSlug]/groups/[groupId]

**Purpose:** Updates an existing group's name within a specific drive by slug.
**Auth Required:** Yes
**Request Schema:**
- driveSlug: string (dynamic parameter)
- groupId: string (dynamic parameter)
- name: string
**Response Schema:** Updated group object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### DELETE /api/drives/[driveSlug]/groups/[groupId]

**Purpose:** Deletes a group from a specific drive by slug.
**Auth Required:** Yes
**Request Schema:**
- driveSlug: string (dynamic parameter)
- groupId: string (dynamic parameter)
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/drives/[driveSlug]/pages

**Purpose:** Fetches all pages (or permitted pages) within a specific drive, structured as a tree.
**Auth Required:** Yes
**Request Schema:**
- driveSlug: string (dynamic parameter)
**Response Schema:** Array of page objects (tree structure).
**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/drives/[driveSlug]/trash

**Purpose:** Fetches all trashed pages within a specific drive.
**Auth Required:** Yes
**Request Schema:**
- driveSlug: string (dynamic parameter)
**Response Schema:** Array of trashed page objects (tree structure).
**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/groups/[groupId]/members

**Purpose:** Adds a user as a member to a specific group.
**Auth Required:** Yes
**Request Schema:**
- groupId: string (dynamic parameter)
- userId: string
**Response Schema:** Newly created group membership object.
**Status Codes:** 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### DELETE /api/groups/[groupId]/members/[userId]

**Purpose:** Removes a user from a specific group.
**Auth Required:** Yes
**Request Schema:**
- groupId: string (dynamic parameter)
- userId: string (dynamic parameter)
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13