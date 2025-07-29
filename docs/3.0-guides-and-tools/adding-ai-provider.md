# How to Add a New AI Provider

This guide explains how to add a new AI provider to the pagespace application, leveraging the Vercel AI SDK. For this example, we will use a hypothetical "CustomAI" provider. Note that OpenAI, Anthropic, Google, and OpenRouter are already integrated.

## Prerequisites

- You will need an API key from the provider you want to add. For this example, you'll need a hypothetical `CUSTOM_AI_API_KEY`.

## Step 1: Install the Provider's SDK

First, install the official Vercel AI SDK package for the desired provider.

```bash
pnpm add @ai-sdk/custom-ai-provider # Replace with the actual package for your provider
```

## Step 2: Update the Model Factory

The `createModelInstance` function in [`apps/web/src/app/api/ai/shared/models.ts`](apps/web/src/app/api/ai/shared/models.ts) is a factory that creates model instances based on a string identifier. You need to add a new case for the `openai` provider.

```typescript
// apps/web/src/app/api/ai/shared/models.ts
import { createOllama } from 'ollama-ai-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createCustomAI } from '@ai-sdk/custom-ai-provider'; // 1. Import the new provider
import { NextResponse } from 'next/server';

export function createModelInstance(model: string, apiKey?: string, baseUrl?: string) {
  const [providerName, modelName] = model.split(':');

  if (providerName === 'google') {
    // ... existing google provider logic
  } else if (providerName === 'ollama') {
    // The baseUrl is now resolved in the `resolveModel` function
    const ollama = createOllama({
      baseURL: baseUrl,
    });
    return ollama(modelName);
  } else if (providerName === 'openai') {
    // ... existing openai provider logic
  } else if (providerName === 'anthropic') {
    // ... existing anthropic provider logic
  } else if (providerName === 'openrouter') {
    // ... existing openrouter provider logic
  } else if (providerName === 'customai') { // 2. Add the new provider case
    if (!process.env.CUSTOM_AI_API_KEY) {
      throw new Error('CustomAI API key is not configured.');
    }
    const customai = createCustomAI({
      apiKey: process.env.CUSTOM_AI_API_KEY,
    });
    return customai(modelName);
  } else {
    throw new Error('Invalid model provider');
  }
}
```

## Step 3: Configure Environment Variables

Add the new provider's API key to your environment variables file.

```.env
# .env
CUSTOM_AI_API_KEY=your-custom-ai-api-key
```

## Step 4: Update Error Handling

To ensure consistent error handling, add a case for the new provider in the `handleModelError` function in the same file.

```typescript
// apps/web/src/app/api/ai/shared/models.ts

export function handleModelError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('Google API key')) {
      return NextResponse.json({ error: 'Google API key is not configured.' }, { status: 500 });
    }
    if (error.message.includes('OpenAI API key')) {
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }
    if (error.message.includes('Anthropic API key')) {
      return NextResponse.json({ error: 'Anthropic API key is not configured.' }, { status: 500 });
    }
    if (error.message.includes('OpenRouter API key')) {
      return NextResponse.json({ error: 'OpenRouter API key is not configured.' }, { status: 500 });
    }
    if (error.message.includes('CustomAI API key')) { // Add error handling for the new provider
      return NextResponse.json({ error: 'CustomAI API key is not configured.' }, { status: 500 });
    }
    if (error.message.includes('Invalid model provider')) {
      return NextResponse.json({ error: 'Invalid model provider' }, { status: 400 });
    }
  }
  return NextResponse.json({ error: 'Failed to initialize AI model' }, { status: 500 });
}
```

## Step 5: Usage

You can now use the new provider in any API route by passing the correct model string (e.g., `"customai:your-model-name"`) to the `createModelInstance` function.

```typescript
// Example usage in an API route
import { createModelInstance, handleModelError } from '../shared/models';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json(); // e.g., model = "customai:your-model-name"
    const aiModel = createModelInstance(model);
    
    const result = await streamText({
      model: aiModel,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return handleModelError(error);
  }
}