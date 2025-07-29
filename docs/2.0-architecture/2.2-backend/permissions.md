# Authorization & Permissions

This document provides a detailed explanation of the permissions and sharing model within the application. It is designed to be a comprehensive guide for developers and administrators on how access control is managed.

## 1. Core Concepts

The permissions system is built on three core concepts: **Ownership**, **Roles (Groups)**, and **Permissions**.

### 1.1. Ownership

*   **The `Drive` is the root of all ownership.** Every `Drive` has a single, designated `owner` (a `User`).
*   **The owner has ultimate power.** The owner of a `Drive` has irrevocable `DELETE` permissions over the `Drive` and all `Pages` within it. This is the highest possible level of access and cannot be overridden by any other permission setting.
*   **Source of Truth:** The `ownerId` field on the `Drive` model is the absolute source of truth for ownership.

### 1.2. Roles (Implemented as Groups)

*   **Groups are drive-specific roles.** Users can create `Group` entities within a `Drive` to represent roles (e.g., "Admins", "Interns", "Client Team").
*   **Groups contain users.** A `Group` is a container for `User`s, managed through the `GroupMembership` table. A user can be a member of multiple groups within a single drive.
*   **Permissions are assigned to groups.** Instead of assigning permissions to each user individually, you can assign a permission to a `Group`. Every member of that group will then inherit that permission.

### 1.3. Permissions

*   **Permissions grant specific actions.** A `Permission` is a record that grants a specific `PermissionAction` on a `Page` to a `Subject` (which can be either a single `User` or a `Group`).
*   **Granular Actions:** The available actions are defined by the `PermissionAction` enum:
    *   `VIEW`: The user can view the page and its content.
    *   `EDIT`: The user can view and edit the page and its content.
    *   `SHARE`: The user can view, edit, and manage the permissions for the page (i.e., share it with other users or groups).
    *   `DELETE`: The user can move the page to the trash.
*   **Action Precedence:** The actions are hierarchical. A user with a higher-level permission implicitly has all lower-level permissions. The order of precedence is:
    `DELETE` > `SHARE` > `EDIT` > `VIEW`

---

## 2. The Authorization Flow: How Access is Determined

When a user attempts to access a page, the system executes a precise algorithm to determine their access level. This logic is encapsulated in the `getUserAccessLevel` function.

```mermaid
graph TD
    subgraph "Authorization Flow"
        A[Start: User requests access to a Page] --> B{Is User the Owner of the Page's Drive?};
        B -- Yes --> C[Access Granted: DELETE];
        B -- No --> D{Gather User's Subject IDs};
        D --> E[Find all Page Ancestors];
        E --> F{Search for Permissions};
        F --> G{Any Permissions Found?};
        G -- No --> H[Access Denied];
        G -- Yes --> I[Resolve the Highest-Precedence Permission];
        I --> J[Access Granted with Resolved Permission];
    end

    subgraph "Data Model"
        U[User] -- "Owns" --> DR[Drive]
        DR -- "Contains" --> P1[Page 1]
        P1 -- "Contains" --> P2[Page 2]
        U -- "Member of" --> G1[Group]
        G1 -- "Has Permission on" -> P1
        U -- "Has Permission on" --> P2
    end

    style C fill:#d4edda,stroke:#155724
    style H fill:#f8d7da,stroke:#721c24
    style J fill:#d4edda,stroke:#155724
```

### Step-by-Step Breakdown:

1.  **Check for Ownership (The Ultimate Override):** The system first checks if the user is the owner of the parent `Drive`. If they are, they are immediately granted `DELETE` access, and the process stops.
2.  **Gather Subject IDs:** If the user is not the owner, the system gathers all potential identifiers for that user:
    *   Their own `userId`.
    *   The `groupId` of every `Group` they are a member of within that drive.
3.  **Find Page Ancestors:** The system walks up the page hierarchy from the target page to the root, collecting the IDs of all parent pages. This is done efficiently with a recursive SQL query.
4.  **Search for Permissions:** The system queries the `Permission` table, looking for any records where the `pageId` is in the list of ancestors AND the `subjectId` is in the list of the user's subject IDs.
5.  **Resolve the Highest Permission:** If any permissions are found, the system uses the `permissionPrecedence` array (`['VIEW', 'EDIT', 'SHARE', 'DELETE']`) to determine which permission is the most powerful.
6.  **Resolve the Highest Permission:** The system evaluates all permissions found on the page and its ancestors. The effective permission is the one with the highest precedence (e.g., `EDIT` over `VIEW`). The current implementation resolves only the highest precedence, not the closest.
7.  **No Permissions, No Access:** If no permissions are found after checking all ancestors, the user is denied access.

### Example Scenario

Consider the following hierarchy: `Drive A (Owner: Alice)` -> `Folder X` -> `Document Y`.

1.  **Alice** requests `Document Y`.
    *   **Result:** `DELETE` access. The system checks that Alice is the owner of `Drive A` and immediately grants full permissions.

2.  **Bob**, a member of the "Editors" group, requests `Document Y`. The "Editors" group has `EDIT` permission on `Folder X`.
    *   **Result:** `EDIT` access. The system checks for ownership (false), then finds Bob's permissions. It walks up to `Folder X`, finds the `EDIT` permission for the "Editors" group, and grants it.

3.  **Charlie** has been granted `VIEW` permission directly on `Document Y`. The "Editors" group (of which he is not a member) has `EDIT` permission on the parent `Folder X`.
    *   **Result:** `EDIT` access. The system finds two potential permissions: an inherited `EDIT` from `Folder X` and a direct `VIEW` on `Document Y`. The system resolves the highest precedence, which is `EDIT`.


---

## 3. Core Functions

The core logic for the permissions system is located in `packages/lib/src/permissions.ts`.

### getUserGroups(userId: string, driveId?: string): Promise<string[]>
**Purpose:** Fetches all group IDs for a given user, optionally scoped to a specific drive.
**Location:** [`packages/lib/src/permissions.ts:12`](packages/lib/src/permissions.ts:12)
**Dependencies:** Drizzle
**Last Updated:** 2025-07-13

### getPageAncestors(pageId: string): Promise<string[]>
**Purpose:** Fetches all ancestor page IDs for a given page using a recursive CTE.
**Location:** [`packages/lib/src/permissions.ts:34`](packages/lib/src/permissions.ts:34)
**Dependencies:** Drizzle
**Last Updated:** 2025-07-13

### findPermissions(pageIds: string[], subjectIds: string[]): Promise<Permission[]>
**Purpose:** Finds all permissions for a given set of pages and subjects (users/groups).
**Location:** [`packages/lib/src/permissions.ts:56`](packages/lib/src/permissions.ts:56)
**Dependencies:** Drizzle
**Last Updated:** 2025-07-13

### resolveHighestPermission(permissions: Permission[]): PermissionAction | null
**Purpose:** Resolves the highest permission level from a list based on defined precedence.
**Location:** [`packages/lib/src/permissions.ts:89`](packages/lib/src/permissions.ts:89)
**Dependencies:** None
**Last Updated:** 2025-07-13

### getUserAccessLevel(userId: string, pageId: string): Promise<PermissionAction | null>
**Purpose:** The main authorization function; determines a user's access level for a page.
**Location:** [`packages/lib/src/permissions.ts:118`](packages/lib/src/permissions.ts:118)
**Dependencies:** Drizzle, `getUserGroups`, `getPageAncestors`, `findPermissions`, `resolveHighestPermission`
**Last Updated:** 2025-07-13

### getUserAccessiblePages(userId: string, pageIds: string[]): Promise<Map<string, Page>>
**Purpose:** Efficiently determines a user's access level for multiple pages.
**Location:** [`packages/lib/src/permissions.ts:163`](packages/lib/src/permissions.ts:163)
**Dependencies:** Drizzle, `getUserGroups`, `getPageAncestors`, `findPermissions`, `resolveHighestPermission`
**Last Updated:** 2025-07-13