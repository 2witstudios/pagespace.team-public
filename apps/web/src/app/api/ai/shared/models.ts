import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { NextResponse } from 'next/server';
import { db, userAiSettings, eq, and } from '@pagespace/db';
import { decrypt } from '@pagespace/lib/server';

/**
 * Pre-loads an Ollama model to ensure it's ready for chat
 */
async function preloadOllamaModel(baseUrl: string, modelName: string): Promise<void> {
  try {
    console.log(`🔄 Pre-loading Ollama model: ${modelName}`);
    
    // Use Ollama's /api/generate endpoint with an empty prompt to load the model
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: '',
        stream: false,
        keep_alive: '1h', // Keep loaded for 1 hour
      }),
    });

    if (response.ok) {
      console.log(`✅ Model ${modelName} pre-loaded successfully`);
      
      // Set nothink mode to disable thinking step
      try {
        const nothinkResponse = await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            prompt: '/set nothink',
            stream: false,
            keep_alive: '1h',
          }),
        });
        
        if (nothinkResponse.ok) {
          console.log(`✅ Model ${modelName} configured with nothink mode`);
        } else {
          console.warn(`⚠️ Failed to set nothink mode for ${modelName}:`, nothinkResponse.status);
        }
      } catch (nothinkError) {
        console.warn(`⚠️ Error setting nothink mode for ${modelName}:`, nothinkError);
      }
    } else {
      console.warn(`⚠️ Failed to pre-load model ${modelName}:`, response.status);
    }
  } catch (error) {
    console.warn(`⚠️ Error pre-loading model ${modelName}:`, error);
  }
}

export async function resolveModel(userId: string, model: string) {
  console.log('🔍 resolveModel called for userId:', userId, 'model:', model);

  const [provider] = model.split(':');
  if (!provider) {
    throw new Error('Invalid model format. Expected "provider:model"');
  }

  // Get the API key for the specified provider
  let apiKey: string | undefined;
  
  const setting = await db.query.userAiSettings.findFirst({
    where: and(eq(userAiSettings.userId, userId), eq(userAiSettings.provider, provider)),
  });
  
  let baseUrl: string | undefined;
  
  if (setting) {
    console.log('Found setting:', { id: setting.id, provider: setting.provider, hasKey: !!setting.encryptedApiKey, hasUrl: !!setting.baseUrl });
    baseUrl = setting.baseUrl ?? undefined;
  } else {
    console.log('No setting found for provider:', provider);
  }

  if (provider === 'ollama' && !baseUrl) {
    baseUrl = process.env.OLLAMA_BASE_URL;
    console.log('No user-configured baseUrl for Ollama, using default:', baseUrl);
  }
  
  if (setting?.encryptedApiKey) {
    try {
      apiKey = await decrypt(setting.encryptedApiKey);
      console.log('✅ API key decrypted successfully');
    } catch (error) {
      console.error("❌ Failed to decrypt API key for user", userId, "and provider", provider, error);
      throw new Error(`Failed to decrypt API key for ${provider}`);
    }
  } else if (provider !== 'ollama') {
    console.log('⚠️ No user API key found for provider:', provider, '- checking environment');
    // If no user key, try environment variables
    if (provider === 'google' && process.env.GOOGLE_API_KEY) {
      apiKey = process.env.GOOGLE_API_KEY;
    } else if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY;
    } else if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      apiKey = process.env.ANTHROPIC_API_KEY;
    } else if (provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
      apiKey = process.env.OPENROUTER_API_KEY;
    } else if (provider === 'ollama') {
      // Ollama doesn't need an API key, but we check for a baseUrl
      if (provider === 'ollama' && !baseUrl) {
        console.log('Ollama provider without a user-configured baseUrl, will use default');
      }
    } else {
      // For non-Ollama providers, if there's no setting and no env var, it's an error
      throw new Error(`No API key configured for ${provider}`);
    }
  }

  console.log('🎯 Final resolved model:', { provider, hasApiKey: !!apiKey, model, baseUrl });
  
  // Pre-load Ollama models to ensure they're ready for chat
  if (provider === 'ollama' && baseUrl) {
    const parts = model.split(':');
    const modelName = parts.slice(1).join(':'); // Extract "qwen3:8b" from "ollama:qwen3:8b"
    if (modelName && modelName !== 'dummy') { // Skip the dummy model used for config checks
      // Don't await this - let it load in the background
      preloadOllamaModel(baseUrl, modelName).catch(() => {}); // Silently ignore errors
    }
  }
  
  return { provider, apiKey, model, baseUrl };
}


/**
 * Creates an AI model instance based on the model string format "provider:model"
 * Extracted from existing working AI routes
 */
export function createModelInstance(model: string, apiKey?: string, baseUrl?: string) {
  const parts = model.split(':');
  const providerName = parts[0];
  const modelName = parts.slice(1).join(':'); // Handle models like "qwen3:8b"

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
    // Use OpenAI-compatible API for Ollama
    const ollama = createOpenAI({
      baseURL: `${baseUrl}/v1`,
      apiKey: 'ollama', // Ollama doesn't validate API keys
    });
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

/**
 * Handles model creation errors consistently across AI routes
 */
export function handleModelError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes('Invalid model provider')) {
      return NextResponse.json({ error: 'Invalid model provider' }, { status: 400 });
    }
  }
  return NextResponse.json({ error: 'Failed to initialize AI model' }, { status: 500 });
}