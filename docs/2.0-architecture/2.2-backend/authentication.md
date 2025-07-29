# Authentication

Authentication is managed by a **custom JWT-based system**, providing secure user session management.

*   **Strategy:** The application uses email and password-based login. User credentials are not stored in plaintext; passwords are hashed using `bcrypt` before being saved to the database.
*   **Session Management:** Sessions are managed using JSON Web Tokens (JWTs). Upon successful login, an `accessToken` and a `refreshToken` are generated using the `jose` library. These tokens are stored in secure, HTTP-only cookies. The `refreshToken` is also persisted in the `refreshTokens` database table, along with device and IP information for session management and revocation. The JWTs contain the user's ID and a `tokenVersion`, which is used for token invalidation (e.g., on password change or logout).
*   **Key API Routes:**
    *   `POST /api/auth/signup`: Handles user registration, including password hashing and initial user creation.
    *   `POST /api/auth/login`: Manages user login, password verification, and the issuance of access and refresh tokens.
    *   `GET /api/auth/me`: Verifies the validity of the access token and retrieves the authenticated user's details.
*   **Key Utility Functions:**
    *   The core utility functions for handling JWTs are located in `packages/lib/src/auth-utils.ts`.

---

## Database Schema for Authentication

### `users` Table

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Unique identifier for the user. |
| `name` | `text` | The user's name. |
| `email` | `text` | The user's email address. |
| `emailVerified` | `timestamp` | When the user's email was verified. |
| `image` | `text` | A URL for the user's profile image. |
| `password` | `text` | The user's hashed password. |
| `tokenVersion` | `integer` | The version of the user's token. This is used to invalidate tokens. |

### `refresh_tokens` Table

| Column | Type | Description |
| --- | --- | --- |
| `id` | `text` | Unique identifier for the refresh token. |
| `userId` | `text` | The ID of the user the token belongs to. |
| `token` | `text` | The refresh token. |
| `device` | `text` | The device the token was issued to. |
| `ip` | `text` | The IP address the token was issued to. |
| `userAgent` | `text` | The user agent of the device the token was issued to. |
| `createdAt` | `timestamp` | When the token was created. |

---

## Core Functions

### generateAccessToken(userId: string, tokenVersion: number): Promise<string>
**Purpose:** Creates a short-lived JSON Web Token (JWT) for authenticating user requests.
**Location:** [`packages/lib/src/auth-utils.ts:25`](packages/lib/src/auth-utils.ts:25)
**Dependencies:** `jose`
**Last Updated:** 2025-07-13

### generateRefreshToken(userId: string, tokenVersion: number): Promise<string>
**Purpose:** Creates a long-lived JSON Web Token (JWT) used to obtain new access tokens.
**Location:** [`packages/lib/src/auth-utils.ts:33`](packages/lib/src/auth-utils.ts:33)
**Dependencies:** `jose`
**Last Updated:** 2025-07-13

### decodeToken(token: string): Promise<UserPayload | null>
**Purpose:** Verifies and decodes a JWT, returning the user payload if the token is valid.
**Location:** [`packages/lib/src/auth-utils.ts:13`](packages/lib/src/auth-utils.ts:13)
**Dependencies:** `jose`
**Last Updated:** 2025-07-13