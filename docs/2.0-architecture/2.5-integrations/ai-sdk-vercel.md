# Integration: Vercel AI SDK

This document outlines how pagespace integrates with the Vercel AI SDK to build our AI-powered chat and assistant features.

## High-Level Architecture

The Vercel AI SDK is the core library that connects our frontend components to our backend AI models. It provides a set of hooks for the client and streaming helpers for the server that work together seamlessly.

The end-to-end data flow for an AI chat is as follows:

1.  **Client:** A React component (e.g., [`AiChatView`](apps/web/src/components/layout/middle-content/page-views/ai-page/AiChatView.tsx:1)) uses the `useChat` hook from the AI SDK to manage the UI state of a conversation.
2.  **`useChat` Hook:** When a user sends a message, the `useChat` hook makes a `POST` request to one of our internal API routes (e.g., `/api/ai/ai-page/messages/[pageId]`).
3.  **Backend API Route:** Our Next.js API route receives the request, which contains the message history and other context.
4.  **Model Abstraction:** The API route uses our custom [`createModelInstance`](apps/web/src/app/api/ai/shared/models.ts:9) helper to dynamically select and instantiate an AI model provider (e.g., Ollama for local models, Google for cloud models) based on a model identifier string like `"ollama:llama3"`.
5.  **`streamText` Function:** The core of the backend logic is the AI SDK's `streamText` function. We pass it the instantiated model, a dynamically generated system prompt (which includes context from the current page and any `@mentions`), and the message history.
6.  **Streaming Response:** `streamText` communicates with the AI model and returns a standard `Response` object that streams the AI's response back to the client. Our API route returns this response directly.
7.  **UI Update:** The `useChat` hook on the client receives the streaming response and continuously updates the `messages` array, causing the UI to render the AI's response in real-time.
8.  **Database Persistence:** When the stream is complete, the `onFinish` callback within `streamText` on the server is executed to save both the user's prompt and the final AI response to our database.

## Client-Side Implementation: `useChat`

We use the `useChat` hook as the foundation for all our chat interfaces. It provides a complete solution for managing chat state, including messages, input, and loading status.

-   **Locations:**
    -   [`apps/web/src/components/layout/middle-content/page-views/ai-page/AiChatView.tsx`](apps/web/src/components/layout/middle-content/page-views/ai-page/AiChatView.tsx:1)
    -   [`apps/web/src/components/layout/right-sidebar/ai-assistant/AssistantChat.tsx`](apps/web/src/components/layout/right-sidebar/ai-assistant/AssistantChat.tsx:1)
-   **Key Configuration:**
    -   `api`: We point this to the specific internal API route that handles the logic for this chat (e.g., `/api/ai/ai-assistant/messages`).
    -   `initialMessages`: We use this to populate the chat with existing history fetched from our database.
    -   `body`: We can pass additional context to our backend, such as the `model` to use or the current `pageId`.
-   **Core Functions:**
    -   `messages`: The array of messages in the current chat.
    -   `append`: A function to add a new message from the user and trigger a new response from the AI.
    -   `reload`: A function to re-run the generation for the last message in the history.
    -   `setMessages`: A function to manually update the messages array, which we use for features like editing a message.

## Backend Implementation: `streamText`

Our backend AI logic resides in Next.js API routes within [`apps/web/src/app/api/ai/`](apps/web/src/app/api/ai).

### Model Abstraction

To keep our code clean and support multiple AI providers, we use a helper function, [`createModelInstance`](apps/web/src/app/api/ai/shared/models.ts:9), located in [`apps/web/src/app/api/ai/shared/models.ts`](apps/web/src/app/api/ai/shared/models.ts:1). This function takes a string like `"ollama:llama3"` or `"google:gemini-1.5-pro"`, parses it, and returns an instantiated model object from the appropriate AI SDK provider library.

```typescript
// apps/web/src/app/api/ai/shared/models.ts
export function createModelInstance(model: string, apiKey?: string) {
  const [providerName, modelName] = model.split(':');

  if (providerName === 'google') {
    const finalApiKey = apiKey || process.env.GOOGLE_API_KEY;
    if (!finalApiKey) {
      throw new Error('Google API key is not configured.');
    }
    const google = createGoogleGenerativeAI({
      apiKey: finalApiKey,
    });
    return google(modelName);
  } else if (providerName === 'ollama') {
    const ollama = createOllama();
    return ollama(modelName);
  } else if (providerName === 'openai') {
    const finalApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!finalApiKey) {
        throw new Error('OpenAI API key is not configured.');
    }
    const openai = createOpenAI({
        apiKey: finalApiKey,
    });
    return openai(modelName);
  } else if (providerName === 'anthropic') {
    const finalApiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!finalApiKey) {
        throw new Error('Anthropic API key is not configured.');
    }
    const anthropic = createAnthropic({
        apiKey: finalApiKey,
    });
    return anthropic(modelName);
  } else if (providerName === 'openrouter') {
    const finalApiKey = apiKey || process.env.OPENROUTER_API_KEY;
    if (!finalApiKey) {
        throw new Error('OpenRouter API key is not configured.');
    }
    const openrouter = createOpenRouter({
        apiKey: finalApiKey,
    });
    return openrouter.chat(modelName);
  } else {
    throw new Error('Invalid model provider');
  }
}
```

### Streaming Logic

The core of our backend routes is the call to `streamText`. We provide it with the model, a system prompt, and the message history. The `onFinish` callback is a critical piece, as it allows us to perform server-side actions (like writing to the database) only after the entire response has been successfully generated and streamed to the client.

```typescript
// apps/web/src/app/api/ai/ai-page/messages/[pageId]/route.ts
const result = await streamText({
  model: modelProvider,
  system: enhancedSystemPrompt,
  messages: messages,
  onFinish: async ({ text, toolCalls, toolResults }) => {
    // This code runs on the server after the stream is complete
    await db.transaction(async (tx) => {
      // Save user message to DB
      // Save assistant message to DB
    });
  }
});

return result.toDataStreamResponse();
```

## Environment Variables

-   `GOOGLE_API_KEY`: Required if you want to use models from Google.
-   The Ollama provider assumes that an Ollama server is running and accessible at its default address (`http://localhost:11434`).