# Integration: Ollama

This document outlines how pagespace integrates with Ollama for self-hosted, local AI models.

## Overview

Ollama is a powerful tool that allows us to download and run open-source large language models (LLMs) directly on our local machines. This is a critical component of our local-first development strategy, ensuring that core AI features can be developed and tested without any reliance on cloud-based, proprietary services.

Our backend communicates with the Ollama server via the Vercel AI SDK and the `ollama-ai-provider` library.

## Local Ollama Integration

pagespace is designed to connect to a local Ollama server running on your host machine. This allows you to have full control over your local models while the application runs within Docker.

**Important:** You must have Ollama installed and running on your local machine for the integration to work. You can download it from [ollama.com](https://ollama.com).

The default URL for the Ollama service is `http://host.docker.internal:11434`, which is configured in the `.env` file. This special Docker URL allows the `web` container to communicate with the Ollama server on your host machine. This can be overridden in the AI Provider settings if you need to connect to a different Ollama instance.

## Pulling Models

To use a model, you must first pull it using your local Ollama installation. You can do this by running the following command in your terminal:

```bash
ollama pull llama3
```

Replace `llama3` with any other model you'd like to use.

## How It's Used in Our Code

Our application is designed to seamlessly switch between different AI providers (like Google) and our local Ollama instance.

### Model Selection

We use a simple string format, `"provider:model"`, to specify which AI model to use. To use a local Ollama model, you would use a string like:

-   `"ollama:llama3"`
-   `"ollama:codellama"`

### Backend Integration

Our API routes use a shared helper function, [`createModelInstance`](apps/web/src/app/api/ai/shared/models.ts:73), to get the correct AI model provider. When this function receives a model string starting with `"ollama:"`, it uses the `createOllama` function from the `ollama-ai-provider` library.

```typescript
// apps/web/src/app/api/ai/shared/models.ts
import { createOllama } from 'ollama-ai-provider';

export function createModelInstance(model: string, apiKey?: string, baseUrl?: string) {
  const [providerName, modelName] = model.split(':');

  if (providerName === 'ollama') {
    const ollama = createOllama({
      baseURL: `${baseUrl}/api`,
    });
    return ollama(modelName);
  }
  // ... other providers
}
```

The `createOllama()` function is now initialized with a `baseUrl` that is either set by the user or falls back to the default `NEXT_PUBLIC_OLLAMA_BASE_URL`. The `/api` suffix is now correctly appended to the `baseUrl` before it is passed to the `createOllama` function.