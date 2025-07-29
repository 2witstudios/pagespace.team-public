# Integration: jose

This document outlines how pagespace uses the `jose` library for all JSON Web Token (JWT) operations, which are the foundation of our custom authentication system.

## Overview

`jose` is a powerful, zero-dependency library for creating and verifying JWTs. We use it to implement a standard Access Token / Refresh Token authentication pattern. All JWT-related logic is intended to be centralized in the shared `@pagespace/lib` package.

## Core Implementation: `@pagespace/lib`

The canonical implementation of our JWT logic resides in [`packages/lib/src/auth-utils.ts`](packages/lib/src/auth-utils.ts:1). These functions are used by our authentication API routes and any other part of the system that needs to handle tokens (like the `realtime` server).

### Token Generation

We generate two types of tokens:

1.  **Access Token:** A short-lived token (15 minutes) that grants access to protected API routes.
    -   `generateAccessToken(userId: string, tokenVersion: number)`
2.  **Refresh Token:** A long-lived token (7 days) that can be used to obtain a new access token without requiring the user to log in again.
    -   `generateRefreshToken(userId: string, tokenVersion: number)`

Both functions use `jose.SignJWT` to create a token, setting the algorithm to `HS256` and signing it with a shared secret.

### Token Verification

The `decodeToken(token: string)` function is used to verify and decode an incoming token. It uses `jose.jwtVerify` to:
1.  Check the token's signature against the `JWT_SECRET`.
2.  Verify that the token has not expired.
3.  Ensure the algorithm is `HS256`.

If the token is valid, it returns the payload; otherwise, it returns `null`.

### Token Payload

Our JWT payload is defined by the `UserPayload` interface and contains two crucial pieces of information:

-   `userId`: The ID of the user the token belongs to.
-   `tokenVersion`: An integer that is incremented in the `users` table whenever a user's credentials change (e.g., password reset). When verifying a token, we check that the `tokenVersion` in the payload matches the `tokenVersion` in the database. This is a critical security measure that allows us to instantly invalidate all of a user's existing tokens.

## Web App Implementation & Refactoring Note

There is currently a duplicate implementation of these utility functions in [`apps/web/src/lib/auth-utils.ts`](apps/web/src/lib/auth-utils.ts:1).

**Recommendation:** This file should be deprecated and eventually removed. The `web` application should be refactored to import and use the canonical functions from the `@pagespace/lib` package. This will reduce code duplication and ensure that all parts of our system are using the exact same authentication logic.

## Security Configuration

-   **Algorithm:** We use the `HS256` (HMAC with SHA-256) algorithm for signing all our tokens.
-   **Secret Key:** The signing secret is stored in the `JWT_SECRET` environment variable. This is a critical secret and must be set to a long, random, and secure string in all production environments.