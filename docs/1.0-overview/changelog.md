### 2025-07-29

- **Removed**: Cloudflare tunnel and all related dependencies from the project to ensure a fully local, air-gapped implementation.
- **Changed**: Exposed ports for `web` and `realtime` services in `docker-compose.yml` for local access.

### 2025-07-28

- **Improved**: AI model selection is now "sticky," remembering the user's last-used model for new conversations.
- **Changed**: The default fallback AI model for new users is now `ollama:qwen3:8b`.
- **Added**: New users are now configured with the `ollama` provider by default, enabling immediate use of local AI models.

### 2025-07-28

- **Security**: Major authentication and session handling refactor for enhanced security:
  - **Added**: Comprehensive CSRF protection with secure token generation and validation
  - **Added**: Advanced rate limiting with progressive delays for authentication endpoints
  - **Added**: One-time refresh token rotation system for enhanced security
  - **Added**: Device and IP tracking for session monitoring
  - **Added**: Global session invalidation via token versioning
  - **Improved**: JWT implementation with proper issuer/audience validation
  - **Improved**: Secure cookie configuration with HttpOnly, Secure, and SameSite settings
  - **Added**: New `/api/auth/csrf` endpoint for CSRF token generation
  - **Enhanced**: Login and refresh endpoints with advanced security features
  - **Added**: Environment variables: `JWT_SECRET`, `CSRF_SECRET` for secure operations
  - **Fixed**: Lazy loading of environment variables to prevent build-time errors

### 2025-07-27

- **Feature**: Implemented a new customizable user dashboard.
### 2025-07-27

- Decoupled Ollama from Docker Compose to allow connecting to a local Ollama instance.
  - Replaced the default drive view with a "vibepage" style dashboard.
  - Created a new, isolated AI assistant for the dashboard that is not tied to any specific drive.
  - Added new database tables and API endpoints to support this feature.

- **2025-07-27**:
  - **Fix**: Implemented a database-driven approach to prevent tool call sheets from re-opening. The `toolCallActioned` flag in the `assistantMessages` table is now used to control the UI, ensuring that the preview sheet is only shown for new, un-actioned tool calls.
- **2025-07-26**:
  - **Fix**: Refactored AI assistant state management to prevent tool call sheets from re-opening when switching conversations. The state of accepted tool calls is now persisted globally in the `useAssistantStore`.
- **Fixed**: Corrected an issue in the AI Assistant's `PATCH` route handler, which was causing build failures due to an invalid type signature in Next.js 15. The handler has been updated to properly `await` the `context.params` promise, ensuring compatibility and resolving the type error.

### 2025-07-27

- **Fixed**: Resolved a rendering glitch in the AI Assistant where tool calls in historical conversations were not correctly identified, causing them to be displayed as plain text instead of within an accordion.
- **Fixed**: Implemented a mechanism to prevent the `AiDiffSheet` from reopening for tool calls that have already been accepted or denied.
# Changelog
### 2025-07-26

- **Added**: Expanded the list of available OpenAI models.
### 2025-07-26

- **Added**: Expanded the list of available Anthropic models.
### 2025-07-26

- **Added**: Expanded the list of available OpenRouter models.
### 2025-07-26

- **Added**: Support for Gemini 2.5 Pro, Flash, and Flash-Lite models.
- **Changed**: Default AI model to `gemini-2.5-pro`.

## 2025-07-26

- **Improved Ollama Integration**:
  - Integrated Ollama into the `docker-compose.yml` file for a streamlined setup.
  - The application now defaults to `http://ollama:11434` for the Ollama base URL.
  - This resolves the 400 Bad Request error and simplifies the local development experience.

## 2025-07-25

- **Updated Mention System**:
  - Implemented a unified content fetching system for all page types.
  - When a page is mentioned in the AI Assistant, its content will now be correctly injected into the AI's context. This includes AI chat history, Vibe page content, channel messages, and a list of files for folders.
  - This resolves an issue where only document pages were being correctly processed.
## 2025-07-28

- Updated landing page to remove animations and add a notice about the pre-mvp alpha status with a link to the Discord server.
---
date: 2025-07-28
changes:
  - Implemented a new centralized system for managing AI system prompts.
  - Created a new `@pagespace/prompts` package to handle all prompt-related logic.
  - Added a new `ai_prompts` table to the database for storing and managing prompt templates.
  - Refactored the `ai-page` and `ai-assistant` API routes to use the new prompt management system.
  - Implemented basic sanitization to prevent prompt injection.
  - Updated the system prompts documentation to reflect the new architecture.
---