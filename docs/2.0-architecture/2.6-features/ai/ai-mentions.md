# AI Mentions Architecture & Permission System

## Overview

pagespace supports a unified mention system across all communication interfaces, including Page-AI Chat, Assistant-AI, Channels, and Documents. This document outlines the architecture, permission model, and implementation details.

## System Comparison

### Page-AI Chat (`AI_CHAT` pages)

**Purpose**: AI conversations tied to specific document pages
**Permission Model**: Requires EDIT access on the specific page
**Context Injection**: 
- Static page content (always available)
- Mentioned pages (with permission checking)
- Page-AI conversation history when mentioned from other contexts
**API Route**: `/api/ai/ai-page/messages/[pageId]`
**Storage**: `chat_messages` table linked to pageId
**Scope**: Single page focused

### Assistant-AI (Sidebar AI)

**Purpose**: Multi-document AI assistant for drive-wide conversations
**Permission Model**: Drive-level access + mention-specific permission checking
**Context Injection**:
- Current page context (from page being viewed)
- Dynamically mentioned pages (permission-filtered)
- Assistant conversation history when mentioned
**API Route**: `/api/ai/ai-assistant/messages`
**Storage**: `assistant_conversations` + `assistant_messages` tables
**Scope**: Drive-wide with selective page context

### Channels (`CHANNEL` pages)

**Purpose**: Human-to-human team communication
**Permission Model**: Standard page permissions (VIEW/EDIT)
**Context Injection**: Rich content with mentions, rendered as hyperlinks
**API Route**: `/api/channels/[pageId]/messages`
**Storage**: `channel_messages` table
**Scope**: Page-scoped team communication

### Documents (`DOCUMENT` pages)

**Purpose**: Collaborative rich-text documents
**Permission Model**: Standard page permissions (VIEW/EDIT)
**Context Injection**: Rich content with mentions, rendered as hyperlinks
**API Route**: `/api/pages/[pageId]`
**Storage**: `pages` table (content stored as string array)
**Scope**: Page-scoped document editing

## Mention Types & Data Structures

The mention system supports the following types: `page`, `user`, `ai-page`, `ai-assistant`, and `channel`. The data structures are defined in `apps/web/src/types/mentions.ts`.

## Permission Architecture

### Hierarchical Permission Levels
```typescript
const permissionPrecedence = ['VIEW', 'EDIT', 'SHARE', 'DELETE'];
// Higher index = more permissions (EDIT includes VIEW, etc.)
```

### Permission Checking Flow

1.  **System Access**: User must have access to the system (e.g., drive, page).
2.  **Mention Search**: The `/api/mentions/search` endpoint only returns entities the user has permission to see.
3.  **Context Injection**: The AI system verifies permissions before injecting mentioned content into the context.
4.  **Render Permission**: The frontend verifies permissions before rendering mention links.

## Implementation Architecture

### Frontend Components & Hooks

The frontend implementation is centered around the `RichlineEditor` and a set of reusable hooks.

```
RichlineEditor (from @pagespace/richline-editor)
│
└── DocumentView / ChatInput
    │
    └── useSuggestion
        │
        ├── useSuggestionCore
        │   ├── suggestionApi (fetches from /api/mentions/search)
        │   └── useKeyboardNavigation
        │
        └── SuggestionProvider (React Context)
            │
            └── SuggestionPopup (UI for suggestions)
```

-   **`RichlineEditor`**: The core rich text editor component.
-   **`DocumentView` / `ChatInput`**: Components that implement the `RichlineEditor` for different use cases.
-   **`useSuggestion`**: A unified hook that works with both `RichlineEditor` and `textarea` elements to provide suggestions.
-   **`useSuggestionCore`**: The core logic for fetching and managing suggestion state.
-   **`SuggestionProvider`**: A React context provider that makes suggestion state available to the `SuggestionPopup`.
-   **`SuggestionPopup`**: The UI component that displays the list of suggestions.

### Backend API

-   **`/api/mentions/search`**: A single endpoint for searching all mentionable entities. It performs permission filtering and returns a unified `MentionSuggestion[]` array.

### Database Schema

The database schema uses existing tables (`pages`, `users`, `assistant_conversations`) to source mentionable entities. There is no separate `mentions` table at this time.

## Security Considerations

1.  **Permission Verification**: All mention operations verify user permissions at the API level.
2.  **Content Sanitization**: AI context injection sanitizes content before use.
3.  **Access Logging**: Mention access can be tracked for audit purposes.
4.  **Rate Limiting**: Search endpoints should implement rate limiting.
5.  **Context Boundaries**: AI systems respect content boundaries and permissions.

## Implementation Status

The unified mention system has been fully implemented across all interfaces, including Documents, Page-AI, Assistant-AI, and Channels.

-   **Unified Input**: All inputs now use the `RichlineEditor` component for a consistent user experience.
-   **Rich Content Rendering**: Messages and documents correctly render mentions and formatting.
-   **Multi-Type Support**: The system supports mentions for pages, users, AI chats, AI assistant conversations, and channels.