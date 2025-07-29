# Integration: Tiptap

This document outlines how pagespace uses the Tiptap editor to provide a rich, WYSIWYG text editing experience.

## Overview

Tiptap is a headless, framework-agnostic editor toolkit that gives us full control over the editor's appearance and behavior. We use it to power the "Rich" text editing tab in our document view. It provides a user-friendly interface for creating and formatting content without needing to write raw HTML.

The core implementation is a wrapper component located at [`apps/web/src/components/editors/RichEditor.tsx`](apps/web/src/components/editors/RichEditor.tsx:1).

## Implementation Details

### Component Wrapper & `useEditor` Hook

The [`RichEditor.tsx`](apps/web/src/components/editors/RichEditor.tsx:1) component is built around the `useEditor` hook from `@tiptap/react`. This hook is the central point for configuring the editor's extensions, content, and event handlers.

### Extensions

We use a variety of Tiptap extensions to enable different features:

-   **`StarterKit`**: Provides the basic building blocks like paragraphs, bold, italic, and headings.
-   **`Markdown`**: Allows users to use Markdown syntax that gets converted on the fly.
-   **`Link`**: For creating and editing hyperlinks.
-   **`Placeholder`**: Shows placeholder text when the editor is empty.
-   **`TableKit`**: A comprehensive extension for creating and editing tables.
-   **`CharacterCount`**: Provides a character count for the document.

### State Management and `onUpdate`

Similar to the Monaco editor, the Tiptap editor is a controlled component.

-   It receives its initial content from the `value` prop.
-   The `onUpdate` event handler is the most critical piece of its integration. It fires every time the user makes a change in the editor.
-   Inside `onUpdate`, we call `editor.getHTML()` to get the latest HTML content from Tiptap.
-   **Crucially, this HTML is then passed to our Prettier formatting utility before being sent to the parent `DocumentView` component via the `onChange` callback.** This is the key to solving the single-line HTML problem.

```typescript
// apps/web/src/components/editors/RichEditor.tsx
onUpdate: async ({ editor }) => {
  const html = editor.getHTML();
  const formattedHtml = await formatHtml(html); // Format the HTML
  onChange(formattedHtml); // Pass the formatted HTML up to the parent
},
```

### UI Components: `BubbleMenu` and `FloatingMenu`

Tiptap's headless nature means we are responsible for building the entire UI. We use two special components from Tiptap to create contextual menus:

-   **`BubbleMenu`**: A small menu that appears when a user selects text, providing common formatting options like bold, italic, and headings.
-   **`FloatingMenu`**: A menu that appears when the user types `/` on a new line, offering a quick way to insert different types of content blocks.

These menus are styled with Tailwind CSS and use `lucide-react` for icons.