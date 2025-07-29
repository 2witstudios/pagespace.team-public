# Agentic Behavior: AI-Powered Line Replacement

This document provides a detailed overview of the agentic architecture that enables the AI assistant to reliably suggest and apply edits to user documents. This system is designed to be robust, user-friendly, and resilient to the dynamic nature of a collaborative editing environment.

## Core Philosophy: Human-in-the-Loop

The primary design principle is "human-in-the-loop." The AI acts as a co-author, but the user always has the final say. Every AI-generated edit is presented as a suggestion that must be explicitly reviewed and accepted by the user, ensuring safety and control over the document's content.

## Key Components and Workflow

The line replacement feature is orchestrated by four main components that work in concert to create a seamless experience.

### 1. Backend API: The Director

-   **File:** [`/apps/web/src/app/api/ai/ai-assistant/messages/route.ts`](/apps/web/src/app/api/ai/ai-assistant/messages/route.ts:1)
-   **Responsibility:** This API endpoint is the central controller. It receives the user's prompt and, crucially, the *entire content of the current document*.
-   **The System Prompt:** Its most important job is to construct a precise system prompt for the Large Language Model (LLM). This prompt instructs the AI to behave as a helpful co-author and, most critically, to format any suggested edits using a custom `<ai-diff>` XML schema.

    ```xml
    <ai-diff>
      <original start_line="[line_number]">
        <![CDATA[
        The exact original content to be replaced.
        ]]>
      </original>
      <replacement>
        <![CDATA[
        The new content to insert.
        ]]>
      </replacement>
    </ai-diff>
    ```
-   **Context is King:** By sending the full document context, the API ensures the LLM has all the information it needs to make intelligent, relevant, and context-aware suggestions.

### 2. `ai-diff` Library: The Translator

-   **File:** [`/apps/web/src/lib/ai-diff.ts`](/apps/web/src/lib/ai-diff.ts:1)
-   **Responsibility:** This client-side library is the workhorse that translates the AI's abstract suggestion into a concrete change.
-   **Parsing (`parseAiDiff`):** It first parses the incoming XML to extract the `original` text, the `replacement` text, and the AI's suggested `start_line`.
-   **Fuzzy Searching (`fuzzySearch`):** This is the key to the system's resilience. The AI's `start_line` is just a hint. The user may have added or removed lines since the AI last saw the document. `fuzzySearch` uses a Levenshtein distance algorithm to find the *best possible match* for the `original` text block within a search window around the hinted line. This means the system can find the correct text to replace even if it has moved.
-   **Applying the Change (`applyAiDiff`):** Once the correct location is found, this function splices the new content into the document, carefully preserving the indentation of the original block to maintain code or list formatting.

### 3. Assistant Chat UI: The Conductor

-   **File:** [`/apps/web/src/components/layout/right-sidebar/ai-assistant/AssistantChat.tsx`](/apps/web/src/components/layout/right-sidebar/ai-assistant/AssistantChat.tsx:1)
-   **Responsibility:** This React component manages the user-facing experience in the right sidebar.
-   **Workflow:**
    1.  It detects when an incoming message from the AI contains the `<ai-diff>` structure using the `isValidAiDiff` helper.
    2.  Instead of displaying the raw XML, it renders a user-friendly **"Preview & Apply Changes"** button. While the AI is generating the response, a `ThinkingIndicator` is shown.
    3.  When the user clicks the button, it calls `applyAiDiff` to compute the proposed change against the *current* state of the document.
    4.  It then passes the original and new content to the `AiDiffSheet` component.
    5.  Once a change is accepted, the "Preview & Apply Changes" button is replaced by a `ToolOutput` component, which shows the raw XML of the tool call inside a collapsible accordion.

### 4. Diff Preview Dialog: The Safety Net

-   **File:** [`/apps/web/src/components/ai/AiDiffSheet.tsx`](/apps/web/src/components/ai/AiDiffSheet.tsx:1)
-   **Responsibility:** This component provides the critical "human-in-the-loop" step.
-   **Side-by-Side View:** It uses the Monaco `DiffEditor` to render a clear, intuitive side-by-side comparison of the changes.
-   **User Confirmation:** The user can visually inspect the suggestion and choose to either "Accept" or "Cancel". If accepted, the central `useDocumentStore` is updated, which in turn updates the main editor content.
-   **Approximate Match Warning:** If `fuzzySearch` could not find a perfect match (similarity < 1.0), the dialog will display a warning, advising the user to review the change with extra care.

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant AssistantChat (UI)
    participant Backend API
    participant LLM
    participant AiDiffLib
    participant AiDiffPreview (Dialog)
    participant DocumentStore

    User->>AssistantChat (UI): "Change the title to 'New Title'"
    AssistantChat (UI)->>Backend API: Sends prompt and full document content
    Backend API->>LLM: "Here is the document... Please respond with an <ai-diff>"
    LLM->>Backend API: Returns <ai-diff> XML with original and replacement text
    Backend API->>AssistantChat (UI): Streams back the XML response
    AssistantChat (UI)->>AssistantChat (UI): Sees <ai-diff> and renders "Preview" button
    User->>AssistantChat (UI): Clicks "Preview"
    AssistantChat (UI)->>AiDiffLib: applyAiDiff(currentContent, aiResponse)
    AiDiffLib->>AiDiffLib: fuzzySearch finds the exact lines to replace
    AiDiffLib->>AssistantChat (UI): Returns new, modified document content
    AssistantChat (UI)->>AiDiffSheet (Sheet): Opens with side-by-side diff
    User->>AiDiffSheet (Sheet): Clicks "Accept"
    AiDiffSheet (Sheet)->>DocumentStore: setContent(newContent)
    AssistantChat (UI)->>AssistantChat (UI): Re-renders message to show ToolOutput
    DocumentStore->>DocumentView: Updates state, re-rendering the editor