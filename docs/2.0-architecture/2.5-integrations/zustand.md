# Integration: Zustand

This document outlines how pagespace uses Zustand for client-side state management.

## Core Concept: Client-Side State Management

Zustand is our chosen library for managing **global client-side state**. We use it for state that needs to be shared across multiple, often unrelated, components without the need to pass props down through many levels of the component tree.

It's important to distinguish its role from SWR:
-   **SWR:** Used for managing *server state*—data that is fetched from our API. It handles caching, revalidation, and synchronization with the backend.
-   **Zustand:** Used for managing *client state*—data that exists only within the user's browser session. This includes UI state (like which sidebar is open), user selections, and other ephemeral data that doesn't have a direct representation in the database.

Our convention is to define each store in its own file within the [`apps/web/src/stores`](apps/web/src/stores) or [`apps/web/src/hooks`](apps/web/src/hooks) directories and expose it as a custom hook.

## Zustand Usage Patterns & Examples

We use Zustand to manage various types of state. The following stores are excellent examples of our established patterns.

### 1. Simple UI State: `usePageStore`

-   **Location:** [`apps/web/src/hooks/usePage.ts`](apps/web/src/hooks/usePage.ts:1)
-   **Purpose:** A basic store that holds a single piece of global state: the `pageId` of the currently viewed page. This allows any component in the tree to know which page is active.

```typescript
// apps/web/src/hooks/usePage.ts
export const usePageStore = create<PageState>((set) => ({
  pageId: null,
  setPageId: (pageId) => set({ pageId }),
}));
```

### 2. State with Async Actions: `useDriveStore`

-   **Location:** [`apps/web/src/hooks/useDrive.ts`](apps/web/src/hooks/useDrive.ts:1)
-   **Purpose:** Manages the list of available drives and the currently selected drive.
-   **Pattern:** This store demonstrates how to include async actions (`fetchDrives`) within a store. This action can be called from any component to trigger an API call and update the store's state with the result.

```typescript
// apps/web/src/hooks/useDrive.ts
export const useDriveStore = create<DriveState>((set) => ({
  drives: [],
  currentDriveId: null,
  isLoading: false,
  fetchDrives: async () => {
    set({ isLoading: true });
    const response = await fetch('/api/drives');
    const drives = await response.json();
    set({ drives, isLoading: false });
  },
  // ... other actions
}));
```

### 3. Feature-Specific State: `useAssistantStore`

-   **Location:** [`apps/web/src/stores/useAssistantStore.ts`](apps/web/src/stores/useAssistantStore.ts:1)
-   **Purpose:** Manages all the state for a single, complex feature: the AI Assistant. This includes the active conversation, the list of messages, the chosen AI model, and loading states.
-   **Pattern:** This shows how to co-locate all state related to a specific feature in one place, making it easy to manage and understand.

### 4. Ephemeral UI State: `useSuggestionStore`

-   **Location:** [`apps/web/src/hooks/useSuggestion.ts`](apps/web/src/hooks/useSuggestion.ts:1)
-   **Purpose:** Manages the temporary state of the `@mention` suggestion popup.
-   **Pattern:** This is a perfect example of a store that handles purely ephemeral UI state. The `isOpen`, `position`, and `items` in the store have no long-term persistence and are constantly changing as the user interacts with the editor.

### 5. Persisted State: `useFavorites`

-   **Location:** [`apps/web/src/hooks/useFavorites.ts`](apps/web/src/hooks/useFavorites.ts:1)
-   **Purpose:** Manages the user's list of favorite pages.
-   **Pattern:** This store uses the **`persist` middleware** from Zustand to automatically save the user's favorites to `localStorage`. This ensures that the user's favorites are not lost when they close or refresh the browser tab.
-   **Advanced Persistence:** It also demonstrates how to use a custom `reviver` and `replacer` with `createJSONStorage` to correctly handle complex data types like `Set`, which are not natively supported by JSON.

```typescript
// apps/web/src/hooks/useFavorites.ts
export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: new Set(),
      // ... actions
    }),
    {
      name: 'favorites-storage', // The key in localStorage
      storage: createJSONStorage(() => localStorage, {
        // Custom logic to convert Set -> Array for JSON
        replacer: (key, value) => {
          if (key === 'favorites' && value instanceof Set) {
            return Array.from(value);
          }
          return value;
        },
        // Custom logic to convert Array -> Set from JSON
        reviver: (key, value) => {
          if (key === 'favorites' && Array.isArray(value)) {
            return new Set(value);
          }
          return value;
        },
      }),
    }
  )
);
```

## Best Practices for New Developers

1.  **Identify the State Type:** Before creating a store, determine if you are managing server state or client state. If it comes from an API, use SWR. If it's purely client-side, use Zustand.
2.  **One Store Per Domain:** Create a new store for each distinct "domain" or "feature" of the application.
3.  **Use the `persist` Middleware:** If the state needs to be remembered across browser sessions, use the `persist` middleware.