import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';

export interface AiProvider {
  id: string;
  provider: string;
  updatedAt: Date;
  isConfigured: boolean;
  baseUrl?: string | null;
}

export interface UserAiSettings {
  providers: AiProvider[];
  lastUsedAiModel?: string | null;
}

export interface AiChatSettings {
  model: string;
  providerOverride?: string;
  temperature?: number;
  systemPrompt?: string;
}

interface UseAiSettingsProps {
  // For page-specific settings
  pageId?: string;
  // For assistant settings
  conversationId?: string;
  // Context type to help differentiate behavior
  context: 'page' | 'assistant';
}

interface UseAiSettingsResult {
  // Available providers and their API key status
  providers: AiProvider[];
  lastUsedAiModel?: string | null;
  providersLoading: boolean;
  providersError: unknown;
  
  // Current settings for this context
  currentSettings: AiChatSettings | null;
  settingsLoading: boolean;
  settingsError: unknown;
  
  // Actions
  updateModel: (model: string) => Promise<void>;
  updateProvider: (provider: string, apiKey?: string) => Promise<void>;
  deleteProvider: (provider: string) => Promise<void>;
  
  // Computed values
  availableModels: Array<{ value: string; label: string; provider: string }>;
  currentProvider: string | null;
  suggestedDefaultModel: string | null;
}

const MODELS_BY_PROVIDER = {
  google: [
    { value: 'google:gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'google:gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'google:gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
    { value: 'google:gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'google:gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  openai: [
    { value: 'openai:gpt-4.1', label: 'GPT-4.1' },
    { value: 'openai:o4-mini', label: 'o4-mini' },
    { value: 'openai:o3', label: 'o3' },
    { value: 'openai:gpt-4o', label: 'GPT-4o' },
    { value: 'openai:gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'openai:gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { value: 'anthropic:claude-opus-4-20250514', label: 'Claude Opus 4' },
    { value: 'anthropic:claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'anthropic:claude-3-7-sonnet-20250219', label: 'Claude Sonnet 3.7' },
    { value: 'anthropic:claude-3-5-haiku-20241022', label: 'Claude Haiku 3.5' },
    { value: 'anthropic:claude-3-5-sonnet-20241022', label: 'Claude Sonnet 3.5 v2' },
    { value: 'anthropic:claude-3-5-sonnet-20240620', label: 'Claude Sonnet 3.5' },
    { value: 'anthropic:claude-3-haiku-20240307', label: 'Claude Haiku 3' },
  ],
  openrouter: [
    { value: 'openrouter:qwen/qwen3-235b-a22b-thinking-2507', label: 'Qwen: Qwen3 235B A22B Thinking 2507 (OpenRouter)' },
    { value: 'openrouter:z-ai/glm-4-32b', label: 'Z.AI: GLM 4 32B (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-coder:free', label: 'Qwen: Qwen3 Coder (free) (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-coder', label: 'Qwen: Qwen3 Coder (OpenRouter)' },
    { value: 'openrouter:bytedance/ui-tars-1.5-7b', label: 'Bytedance: UI-TARS 7B (OpenRouter)' },
    { value: 'openrouter:google/gemini-2.5-flash-lite', label: 'Google: Gemini 2.5 Flash Lite (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-235b-a22b-2507:free', label: 'Qwen: Qwen3 235B A22B Instruct 2507 (free) (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-235b-a22b-2507', label: 'Qwen: Qwen3 235B A22B Instruct 2507 (OpenRouter)' },
    { value: 'openrouter:switchpoint/router', label: 'Switchpoint Router (OpenRouter)' },
    { value: 'openrouter:moonshotai/kimi-k2:free', label: 'MoonshotAI: Kimi K2 (free) (OpenRouter)' },
    { value: 'openrouter:moonshotai/kimi-k2', label: 'MoonshotAI: Kimi K2 (OpenRouter)' },
    { value: 'openrouter:thudm/glm-4.1v-9b-thinking', label: 'THUDM: GLM 4.1V 9B Thinking (OpenRouter)' },
    { value: 'openrouter:mistralai/devstral-medium', label: 'Mistral: Devstral Medium (OpenRouter)' },
    { value: 'openrouter:mistralai/devstral-small', label: 'Mistral: Devstral Small 1.1 (OpenRouter)' },
    { value: 'openrouter:cognitivecomputations/dolphin-mistral-24b-venice-edition:free', label: 'Venice: Uncensored (free) (OpenRouter)' },
    { value: 'openrouter:x-ai/grok-4', label: 'xAI: Grok 4 (OpenRouter)' },
    { value: 'openrouter:google/gemma-3n-e2b-it:free', label: 'Google: Gemma 3n 2B (free) (OpenRouter)' },
    { value: 'openrouter:tencent/hunyuan-a13b-instruct:free', label: 'Tencent: Hunyuan A13B Instruct (free) (OpenRouter)' },
    { value: 'openrouter:tencent/hunyuan-a13b-instruct', label: 'Tencent: Hunyuan A13B Instruct (OpenRouter)' },
    { value: 'openrouter:tngtech/deepseek-r1t2-chimera:free', label: 'TNG: DeepSeek R1T2 Chimera (free) (OpenRouter)' },
    { value: 'openrouter:tngtech/deepseek-r1t2-chimera', label: 'TNG: DeepSeek R1T2 Chimera (OpenRouter)' },
    { value: 'openrouter:morph/morph-v3-large', label: 'Morph: Morph V3 Large (OpenRouter)' },
    { value: 'openrouter:morph/morph-v3-fast', label: 'Morph: Morph V3 Fast (OpenRouter)' },
    { value: 'openrouter:baidu/ernie-4.5-300b-a47b', label: 'Baidu: ERNIE 4.5 300B A47B (OpenRouter)' },
    { value: 'openrouter:thedrummer/anubis-70b-v1.1', label: 'TheDrummer: Anubis 70B V1.1 (OpenRouter)' },
    { value: 'openrouter:inception/mercury', label: 'Inception: Mercury (OpenRouter)' },
    { value: 'openrouter:morph/morph-v2', label: 'Morph: Fast Apply (OpenRouter)' },
    { value: 'openrouter:mistralai/mistral-small-3.2-24b-instruct:free', label: 'Mistral: Mistral Small 3.2 24B (free) (OpenRouter)' },
    { value: 'openrouter:mistralai/mistral-small-3.2-24b-instruct', label: 'Mistral: Mistral Small 3.2 24B (OpenRouter)' },
    { value: 'openrouter:minimax/minimax-m1', label: 'MiniMax: MiniMax M1 (OpenRouter)' },
    { value: 'openrouter:google/gemini-2.5-flash-lite-preview-06-17', label: 'Google: Gemini 2.5 Flash Lite Preview 06-17 (OpenRouter)' },
    { value: 'openrouter:google/gemini-2.5-flash', label: 'Google: Gemini 2.5 Flash (OpenRouter)' },
    { value: 'openrouter:google/gemini-2.5-pro', label: 'Google: Gemini 2.5 Pro (OpenRouter)' },
    { value: 'openrouter:moonshotai/kimi-dev-72b:free', label: 'Kimi Dev 72b (free) (OpenRouter)' },
    { value: 'openrouter:openai/o3-pro', label: 'OpenAI: o3 Pro (OpenRouter)' },
    { value: 'openrouter:x-ai/grok-3-mini', label: 'xAI: Grok 3 Mini (OpenRouter)' },
    { value: 'openrouter:x-ai/grok-3', label: 'xAI: Grok 3 (OpenRouter)' },
    { value: 'openrouter:mistralai/magistral-small-2506', label: 'Mistral: Magistral Small 2506 (OpenRouter)' },
    { value: 'openrouter:mistralai/magistral-medium-2506', label: 'Mistral: Magistral Medium 2506 (OpenRouter)' },
    { value: 'openrouter:mistralai/magistral-medium-2506:thinking', label: 'Mistral: Magistral Medium 2506 (thinking) (OpenRouter)' },
    { value: 'openrouter:google/gemini-2.5-pro-preview', label: 'Google: Gemini 2.5 Pro Preview 06-05 (OpenRouter)' },
    { value: 'openrouter:deepseek/deepseek-r1-distill-qwen-7b', label: 'DeepSeek: R1 Distill Qwen 7B (OpenRouter)' },
    { value: 'openrouter:deepseek/deepseek-r1-0528-qwen3-8b:free', label: 'DeepSeek: Deepseek R1 0528 Qwen3 8B (free) (OpenRouter)' },
    { value: 'openrouter:deepseek/deepseek-r1-0528-qwen3-8b', label: 'DeepSeek: Deepseek R1 0528 Qwen3 8B (OpenRouter)' },
    { value: 'openrouter:deepseek/deepseek-r1-0528:free', label: 'DeepSeek: R1 0528 (free) (OpenRouter)' },
    { value: 'openrouter:deepseek/deepseek-r1-0528', label: 'DeepSeek: R1 0528 (OpenRouter)' },
    { value: 'openrouter:sarvamai/sarvam-m:free', label: 'Sarvam AI: Sarvam-M (free) (OpenRouter)' },
    { value: 'openrouter:sarvamai/sarvam-m', label: 'Sarvam AI: Sarvam-M (OpenRouter)' },
    { value: 'openrouter:thedrummer/valkyrie-49b-v1', label: 'TheDrummer: Valkyrie 49B V1 (OpenRouter)' },
    { value: 'openrouter:anthropic/claude-opus-4', label: 'Anthropic: Claude Opus 4 (OpenRouter)' },
    { value: 'openrouter:anthropic/claude-sonnet-4', label: 'Anthropic: Claude Sonnet 4 (OpenRouter)' },
    { value: 'openrouter:mistralai/devstral-small-2505:free', label: 'Mistral: Devstral Small 2505 (free) (OpenRouter)' },
    { value: 'openrouter:mistralai/devstral-small-2505', label: 'Mistral: Devstral Small 2505 (OpenRouter)' },
    { value: 'openrouter:google/gemma-3n-e4b-it:free', label: 'Google: Gemma 3n 4B (free) (OpenRouter)' },
    { value: 'openrouter:google/gemma-3n-e4b-it', label: 'Google: Gemma 3n 4B (OpenRouter)' },
    { value: 'openrouter:openai/codex-mini', label: 'OpenAI: Codex Mini (OpenRouter)' },
    { value: 'openrouter:nousresearch/deephermes-3-mistral-24b-preview', label: 'Nous: DeepHermes 3 Mistral 24B Preview (OpenRouter)' },
    { value: 'openrouter:mistralai/mistral-medium-3', label: 'Mistral: Mistral Medium 3 (OpenRouter)' },
    { value: 'openrouter:google/gemini-2.5-pro-preview-05-06', label: 'Google: Gemini 2.5 Pro Preview 05-06 (OpenRouter)' },
    { value: 'openrouter:arcee-ai/spotlight', label: 'Arcee AI: Spotlight (OpenRouter)' },
    { value: 'openrouter:arcee-ai/maestro-reasoning', label: 'Arcee AI: Maestro Reasoning (OpenRouter)' },
    { value: 'openrouter:arcee-ai/virtuoso-large', label: 'Arcee AI: Virtuoso Large (OpenRouter)' },
    { value: 'openrouter:arcee-ai/coder-large', label: 'Arcee AI: Coder Large (OpenRouter)' },
    { value: 'openrouter:microsoft/phi-4-reasoning-plus', label: 'Microsoft: Phi 4 Reasoning Plus (OpenRouter)' },
    { value: 'openrouter:inception/mercury-coder', label: 'Inception: Mercury Coder (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-4b:free', label: 'Qwen: Qwen3 4B (free) (OpenRouter)' },
    { value: 'openrouter:opengvlab/internvl3-14b', label: 'OpenGVLab: InternVL3 14B (OpenRouter)' },
    { value: 'openrouter:deepseek/deepseek-prover-v2', label: 'DeepSeek: DeepSeek Prover V2 (OpenRouter)' },
    { value: 'openrouter:meta-llama/llama-guard-4-12b', label: 'Meta: Llama Guard 4 12B (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-30b-a3b:free', label: 'Qwen: Qwen3 30B A3B (free) (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-30b-a3b', label: 'Qwen: Qwen3 30B A3B (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-8b:free', label: 'Qwen: Qwen3 8B (free) (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-8b', label: 'Qwen: Qwen3 8B (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-14b:free', label: 'Qwen: Qwen3 14B (free) (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-14b', label: 'Qwen: Qwen3 14B (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-32b', label: 'Qwen: Qwen3 32B (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-235b-a22b:free', label: 'Qwen: Qwen3 235B A22B (free) (OpenRouter)' },
    { value: 'openrouter:qwen/qwen3-235b-a22b', label: 'Qwen: Qwen3 235B A22B (OpenRouter)' },
    { value: 'openrouter:tngtech/deepseek-r1t-chimera:free', label: 'TNG: DeepSeek R1T Chimera (free) (OpenRouter)' },
    { value: 'openrouter:microsoft/mai-ds-r1:free', label: 'Microsoft: MAI DS R1 (free) (OpenRouter)' },
    { value: 'openrouter:microsoft/mai-ds-r1', label: 'Microsoft: MAI DS R1 (OpenRouter)' },
    { value: 'openrouter:thudm/glm-z1-32b:free', label: 'THUDM: GLM Z1 32B (free) (OpenRouter)' },
    { value: 'openrouter:thudm/glm-z1-32b', label: 'THUDM: GLM Z1 32B (OpenRouter)' },
    { value: 'openrouter:thudm/glm-4-32b:free', label: 'THUDM: GLM 4 32B (free) (OpenRouter)' },
    { value: 'openrouter:thudm/glm-4-32b', label: 'THUDM: GLM 4 32B (OpenRouter)' },
    { value: 'openrouter:openai/o4-mini-high', label: 'OpenAI: o4 Mini High (OpenRouter)' },
    { value: 'openrouter:openai/o3', label: 'OpenAI: o3 (OpenRouter)' },
    { value: 'openrouter:openai/o4-mini', label: 'OpenAI: o4 Mini (OpenRouter)' },
    { value: 'openrouter:shisa-ai/shisa-v2-llama3.3-70b:free', label: 'Shisa AI: Shisa V2 Llama 3.3 70B (free) (OpenRouter)' },
    { value: 'openrouter:shisa-ai/shisa-v2-llama3.3-70b', label: 'Shisa AI: Shisa V2 Llama 3.3 70B (OpenRouter)' },
    { value: 'openrouter:openai/gpt-4.1', label: 'OpenAI: GPT-4.1 (OpenRouter)' },
    { value: 'openrouter:openai/gpt-4.1-mini', label: 'OpenAI: GPT-4.1 Mini (OpenRouter)' },
    { value: 'openrouter:openai/gpt-4.1-nano', label: 'OpenAI: GPT-4.1 Nano (OpenRouter)' },
    { value: 'openrouter:eleutherai/llemma_7b', label: 'EleutherAI: Llemma 7b (OpenRouter)' },
    { value: 'openrouter:alfredpros/codellama-7b-instruct-solidity', label: 'AlfredPros: CodeLLaMa 7B Instruct Solidity (OpenRouter)' },
    { value: 'openrouter:arliai/qwq-32b-arliai-rpr-v1:free', label: 'ArliAI: QwQ 32B RpR v1 (free) (OpenRouter)' },
    { value: 'openrouter:arliai/qwq-32b-arliai-rpr-v1', label: 'ArliAI: QwQ 32B RpR v1 (OpenRouter)' },
    { value: 'openrouter:agentica-org/deepcoder-14b-preview:free', label: 'Agentica: Deepcoder 14B Preview (free) (OpenRouter)' },
    { value: 'openrouter:agentica-org/deepcoder-14b-preview', label: 'Agentica: Deepcoder 14B Preview (OpenRouter)' },
    { value: 'openrouter:moonshotai/kimi-vl-a3b-thinking:free', label: 'Moonshot AI: Kimi VL A3B Thinking (free) (OpenRouter)' },
    { value: 'openrouter:moonshotai/kimi-vl-a3b-thinking', label: 'Moonshot AI: Kimi VL A3B Thinking (OpenRouter)' },
    { value: 'openrouter:x-ai/grok-3-mini-beta', label: 'xAI: Grok 3 Mini Beta (OpenRouter)' },
    { value: 'openrouter:x-ai/grok-3-beta', label: 'xAI: Grok 3 Beta (OpenRouter)' },
    { value: 'openrouter:nvidia/llama-3.3-nemotron-super-49b-v1', label: 'NVIDIA: Llama 3.3 Nemotron Super 49B v1 (OpenRouter)' },
    { value: 'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free', label: 'NVIDIA: Llama 3.1 Nemotron Ultra 253B v1 (free) (OpenRouter)' },
    { value: 'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'NVIDIA: Llama 3.1 Nemotron Ultra 253B v1 (OpenRouter)' },
    { value: 'openrouter:meta-llama/llama-4-maverick', label: 'Meta: Llama 4 Maverick (OpenRouter)' },
    { value: 'openrouter:meta-llama/llama-4-scout', label: 'Meta: Llama 4 Scout (OpenRouter)' },
    { value: 'openrouter:deepseek/deepseek-v3-base', label: 'DeepSeek: DeepSeek V3 Base (OpenRouter)' },
    { value: 'openrouter:scb10x/llama3.1-typhoon2-70b-instruct', label: 'Typhoon2 70B Instruct (OpenRouter)' },
    { value: 'openrouter:google/gemini-2.5-pro-exp-03-25', label: 'Google: Gemini 2.5 Pro Experimental (OpenRouter)' },
    { value: 'openrouter:qwen/qwen2.5-vl-32b-instruct:free', label: 'Qwen: Qwen2.5 VL 32B Instruct (free) (OpenRouter)' },
    { value: 'openrouter:qwen/qwen2.5-vl-32b-instruct', label: 'Qwen: Qwen2.5 VL 32B Instruct (OpenRouter)' },
    { value: 'openrouter:deepseek/deepseek-chat-v3-0324:free', label: 'DeepSeek: DeepSeek V3 0324 (free) (OpenRouter)' },
    { value: 'openrouter:deepseek/deepseek-chat-v3-0324', label: 'DeepSeek: DeepSeek V3 0324 (OpenRouter)' },
    { value: 'openrouter:featherless/qwerky-72b:free', label: 'Qrwkv 72B (free) (OpenRouter)' },
    { value: 'openrouter:openai/o1-pro', label: 'OpenAI: o1-pro (OpenRouter)' },
    { value: 'openrouter:mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral: Mistral Small 3.1 24B (free) (OpenRouter)' },
    { value: 'openrouter:mistralai/mistral-small-3.1-24b-instruct', label: 'Mistral: Mistral Small 3.1 24B (OpenRouter)' },
    { value: 'openrouter:google/gemma-3-4b-it:free', label: 'Google: Gemma 3 4B (free) (OpenRouter)' },
    { value: 'openrouter:google/gemma-3-4b-it', label: 'Google: Gemma 3 4B (OpenRouter)' },
  ],
  ollama: [
    { value: 'ollama:qwen3:8b', label: 'DeepSeek R1 8B' },
    { value: 'ollama:llama3', label: 'Llama 3' },
    { value: 'ollama:mistral', label: 'Mistral' },
    { value: 'ollama:codellama', label: 'Code Llama' },
  ],
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
};

// Default fallback model when no user preference or API keys are available
const DEFAULT_FALLBACK_MODEL = 'ollama:qwen3:8b';

/**
 * Determines the best model to use based on fallback hierarchy:
 * 1. User's last used model (if accessible)
 * 2. Ollama deepseek-r1:8b (if available)
 * 3. Any available model from configured providers
 */
const getDefaultModel = (
  lastUsedAiModel: string | null | undefined,
  availableModels: Array<{ value: string; label: string; provider: string }>
): string | null => {
  // If no models are available, return null
  if (!availableModels.length) return null;

  // 1. Try user's last used model if it's available
  if (lastUsedAiModel && availableModels.some(m => m.value === lastUsedAiModel)) {
    return lastUsedAiModel;
  }

  // 2. Try default fallback model (ollama:qwen3:8b)
  if (availableModels.some(m => m.value === DEFAULT_FALLBACK_MODEL)) {
    return DEFAULT_FALLBACK_MODEL;
  }

  // 3. Try any ollama model as fallback
  const ollamaModel = availableModels.find(m => m.provider === 'ollama');
  if (ollamaModel) {
    return ollamaModel.value;
  }

  // 4. Use first available model as last resort
  return availableModels[0]?.value || null;
};

export function useAiSettings({ pageId, conversationId, context }: UseAiSettingsProps): UseAiSettingsResult {
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch available providers
  const { data: userAiSettings, error: providersError, isLoading: providersLoading, mutate: mutateProviders } = useSWR<UserAiSettings>(
    '/api/ai/user-settings',
    fetcher
  );

  const providers = userAiSettings?.providers || [];
  const lastUsedAiModel = userAiSettings?.lastUsedAiModel;

  // Fetch current settings based on context
  const settingsUrl = context === 'page' && pageId 
    ? `/api/ai/ai-page/settings/${pageId}`
    : context === 'assistant' && conversationId
    ? `/api/ai/ai-assistant/conversations/${conversationId}`
    : null;

  const { data: currentSettings, error: settingsError, isLoading: settingsLoading, mutate: mutateSettings } = useSWR<AiChatSettings>(
    settingsUrl,
    fetcher
  );

  // Always fetch Ollama models (will fallback to environment config if no user setting)
  // Use static fallback if dynamic fetch fails
  const { data: ollamaModels = [], error: ollamaError } = useSWR(
    '/api/ai/ollama/models',
    fetcher,
    {
      fallbackData: [
        { value: 'ollama:qwen3:8b', label: 'DeepSeek R1 8B' },
        { value: 'ollama:llama3', label: 'Llama 3' },
        { value: 'ollama:mistral', label: 'Mistral' },
        { value: 'ollama:codellama', label: 'Code Llama' },
      ]
    }
  );

  // Compute available models based on providers with API keys
  const configuredProviderModels = providers
    .filter(p => p.isConfigured)
    .flatMap(p => {
      if (p.provider === 'ollama') {
        // Use dynamic models if available, otherwise use static fallback
        return ollamaModels.length > 0 ? ollamaModels : MODELS_BY_PROVIDER.ollama;
      }
      return MODELS_BY_PROVIDER[p.provider as keyof typeof MODELS_BY_PROVIDER] || [];
    });
  
  // Always include Ollama models as fallback (even without user configuration)
  const hasOllamaProvider = providers.some(p => p.provider === 'ollama');
  let allModels;
  
  if (hasOllamaProvider) {
    // If user has Ollama configured, use their configured models
    allModels = configuredProviderModels;
  } else {
    // If no Ollama configuration, always include static Ollama models as fallback
    const fallbackOllamaModels = ollamaError ? MODELS_BY_PROVIDER.ollama : ollamaModels;
    allModels = [...configuredProviderModels, ...fallbackOllamaModels];
  }
    
  const availableModels = allModels.map(model => ({ ...model, provider: model.value.split(':')[0] }));

  // Get current provider from current model
  const currentProvider = currentSettings?.model ? currentSettings.model.split(':')[0] : null;

  // Update model for current context
  const updateModel = useCallback(async (model: string) => {
    if (!settingsUrl) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(settingsUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update model');
      }
      
      await mutateSettings();
      
      // Also update the user's lastUsedAiModel
      await fetch('/api/ai/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastUsedAiModel: model }),
      });
      
      await mutateProviders();
    } finally {
      setIsUpdating(false);
    }
  }, [settingsUrl, mutateSettings, mutateProviders]);

  // Update provider (add/update API key)
  const updateProvider = useCallback(async (provider: string, apiKey?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/ai/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update provider');
      }
      
      await mutateProviders();
    } finally {
      setIsUpdating(false);
    }
  }, [mutateProviders]);

  // Delete provider API key
  const deleteProvider = useCallback(async (provider: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/ai/user-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete provider');
      }
      
      await mutateProviders();
    } finally {
      setIsUpdating(false);
    }
  }, [mutateProviders]);

  // Get suggested default model based on fallback hierarchy
  const suggestedDefaultModel = getDefaultModel(lastUsedAiModel, availableModels);

  // Auto-initialize with suggested default model if no current settings exist
  useEffect(() => {
    if (!settingsLoading && !currentSettings && suggestedDefaultModel && settingsUrl && availableModels.length > 0) {
      // Only auto-initialize if we have a valid suggested model and it's available
      const isModelAvailable = availableModels.some(m => m.value === suggestedDefaultModel);
      if (isModelAvailable) {
        updateModel(suggestedDefaultModel);
      }
    }
  }, [settingsLoading, currentSettings, suggestedDefaultModel, settingsUrl, availableModels, updateModel]);

  return {
    providers,
    lastUsedAiModel,
    providersLoading: providersLoading || isUpdating,
    providersError,
    
    currentSettings: currentSettings ?? null,
    settingsLoading: settingsLoading || isUpdating,
    settingsError,
    
    updateModel,
    updateProvider,
    deleteProvider,
    
    availableModels,
    currentProvider,
    suggestedDefaultModel,
  };
}