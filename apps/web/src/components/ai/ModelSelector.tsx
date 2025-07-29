'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// This will be replaced by a proper provider configuration object
const providerModels = {
  google: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  ],
  openai: [
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'o4-mini', name: 'o4-mini' },
    { id: 'o3', name: 'o3' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude Sonnet 3.7' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude Sonnet 3.5 v2' },
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude Sonnet 3.5' },
    { id: 'claude-3-haiku-20240307', name: 'Claude Haiku 3' },
  ],
  openrouter: [
    { id: 'qwen/qwen3-235b-a22b-thinking-2507', name: 'Qwen: Qwen3 235B A22B Thinking 2507' },
    { id: 'z-ai/glm-4-32b', name: 'Z.AI: GLM 4 32B' },
    { id: 'qwen/qwen3-coder:free', name: 'Qwen: Qwen3 Coder (free)' },
    { id: 'qwen/qwen3-coder', name: 'Qwen: Qwen3 Coder' },
    { id: 'bytedance/ui-tars-1.5-7b', name: 'Bytedance: UI-TARS 7B' },
    { id: 'google/gemini-2.5-flash-lite', name: 'Google: Gemini 2.5 Flash Lite' },
    { id: 'qwen/qwen3-235b-a22b-2507:free', name: 'Qwen: Qwen3 235B A22B Instruct 2507 (free)' },
    { id: 'qwen/qwen3-235b-a22b-2507', name: 'Qwen: Qwen3 235B A22B Instruct 2507' },
    { id: 'switchpoint/router', name: 'Switchpoint Router' },
    { id: 'moonshotai/kimi-k2:free', name: 'MoonshotAI: Kimi K2 (free)' },
    { id: 'moonshotai/kimi-k2', name: 'MoonshotAI: Kimi K2' },
    { id: 'thudm/glm-4.1v-9b-thinking', name: 'THUDM: GLM 4.1V 9B Thinking' },
    { id: 'mistralai/devstral-medium', name: 'Mistral: Devstral Medium' },
    { id: 'mistralai/devstral-small', name: 'Mistral: Devstral Small 1.1' },
    { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Venice: Uncensored (free)' },
    { id: 'x-ai/grok-4', name: 'xAI: Grok 4' },
    { id: 'google/gemma-3n-e2b-it:free', name: 'Google: Gemma 3n 2B (free)' },
    { id: 'tencent/hunyuan-a13b-instruct:free', name: 'Tencent: Hunyuan A13B Instruct (free)' },
    { id: 'tencent/hunyuan-a13b-instruct', name: 'Tencent: Hunyuan A13B Instruct' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'TNG: DeepSeek R1T2 Chimera (free)' },
    { id: 'tngtech/deepseek-r1t2-chimera', name: 'TNG: DeepSeek R1T2 Chimera' },
    { id: 'morph/morph-v3-large', name: 'Morph: Morph V3 Large' },
    { id: 'morph/morph-v3-fast', name: 'Morph: Morph V3 Fast' },
    { id: 'baidu/ernie-4.5-300b-a47b', name: 'Baidu: ERNIE 4.5 300B A47B' },
    { id: 'thedrummer/anubis-70b-v1.1', name: 'TheDrummer: Anubis 70B V1.1' },
    { id: 'inception/mercury', name: 'Inception: Mercury' },
    { id: 'morph/morph-v2', name: 'Morph: Fast Apply' },
    { id: 'mistralai/mistral-small-3.2-24b-instruct:free', name: 'Mistral: Mistral Small 3.2 24B (free)' },
    { id: 'mistralai/mistral-small-3.2-24b-instruct', name: 'Mistral: Mistral Small 3.2 24B' },
    { id: 'minimax/minimax-m1', name: 'MiniMax: MiniMax M1' },
    { id: 'google/gemini-2.5-flash-lite-preview-06-17', name: 'Google: Gemini 2.5 Flash Lite Preview 06-17' },
    { id: 'google/gemini-2.5-flash', name: 'Google: Gemini 2.5 Flash' },
    { id: 'google/gemini-2.5-pro', name: 'Google: Gemini 2.5 Pro' },
    { id: 'moonshotai/kimi-dev-72b:free', name: 'Kimi Dev 72b (free)' },
    { id: 'openai/o3-pro', name: 'OpenAI: o3 Pro' },
    { id: 'x-ai/grok-3-mini', name: 'xAI: Grok 3 Mini' },
    { id: 'x-ai/grok-3', name: 'xAI: Grok 3' },
    { id: 'mistralai/magistral-small-2506', name: 'Mistral: Magistral Small 2506' },
    { id: 'mistralai/magistral-medium-2506', name: 'Mistral: Magistral Medium 2506' },
    { id: 'mistralai/magistral-medium-2506:thinking', name: 'Mistral: Magistral Medium 2506 (thinking)' },
    { id: 'google/gemini-2.5-pro-preview', name: 'Google: Gemini 2.5 Pro Preview 06-05' },
    { id: 'deepseek/deepseek-r1-distill-qwen-7b', name: 'DeepSeek: R1 Distill Qwen 7B' },
    { id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', name: 'DeepSeek: Deepseek R1 0528 Qwen3 8B (free)' },
    { id: 'deepseek/deepseek-r1-0528-qwen3-8b', name: 'DeepSeek: Deepseek R1 0528 Qwen3 8B' },
    { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek: R1 0528 (free)' },
    { id: 'deepseek/deepseek-r1-0528', name: 'DeepSeek: R1 0528' },
    { id: 'sarvamai/sarvam-m:free', name: 'Sarvam AI: Sarvam-M (free)' },
    { id: 'sarvamai/sarvam-m', name: 'Sarvam AI: Sarvam-M' },
    { id: 'thedrummer/valkyrie-49b-v1', name: 'TheDrummer: Valkyrie 49B V1' },
    { id: 'anthropic/claude-opus-4', name: 'Anthropic: Claude Opus 4' },
    { id: 'anthropic/claude-sonnet-4', name: 'Anthropic: Claude Sonnet 4' },
    { id: 'mistralai/devstral-small-2505:free', name: 'Mistral: Devstral Small 2505 (free)' },
    { id: 'mistralai/devstral-small-2505', name: 'Mistral: Devstral Small 2505' },
    { id: 'google/gemma-3n-e4b-it:free', name: 'Google: Gemma 3n 4B (free)' },
    { id: 'google/gemma-3n-e4b-it', name: 'Google: Gemma 3n 4B' },
    { id: 'openai/codex-mini', name: 'OpenAI: Codex Mini' },
    { id: 'nousresearch/deephermes-3-mistral-24b-preview', name: 'Nous: DeepHermes 3 Mistral 24B Preview' },
    { id: 'mistralai/mistral-medium-3', name: 'Mistral: Mistral Medium 3' },
    { id: 'google/gemini-2.5-pro-preview-05-06', name: 'Google: Gemini 2.5 Pro Preview 05-06' },
    { id: 'arcee-ai/spotlight', name: 'Arcee AI: Spotlight' },
    { id: 'arcee-ai/maestro-reasoning', name: 'Arcee AI: Maestro Reasoning' },
    { id: 'arcee-ai/virtuoso-large', name: 'Arcee AI: Virtuoso Large' },
    { id: 'arcee-ai/coder-large', name: 'Arcee AI: Coder Large' },
    { id: 'microsoft/phi-4-reasoning-plus', name: 'Microsoft: Phi 4 Reasoning Plus' },
    { id: 'inception/mercury-coder', name: 'Inception: Mercury Coder' },
    { id: 'qwen/qwen3-4b:free', name: 'Qwen: Qwen3 4B (free)' },
    { id: 'opengvlab/internvl3-14b', name: 'OpenGVLab: InternVL3 14B' },
    { id: 'deepseek/deepseek-prover-v2', name: 'DeepSeek: DeepSeek Prover V2' },
    { id: 'meta-llama/llama-guard-4-12b', name: 'Meta: Llama Guard 4 12B' },
    { id: 'qwen/qwen3-30b-a3b:free', name: 'Qwen: Qwen3 30B A3B (free)' },
    { id: 'qwen/qwen3-30b-a3b', name: 'Qwen: Qwen3 30B A3B' },
    { id: 'qwen/qwen3-8b:free', name: 'Qwen: Qwen3 8B (free)' },
    { id: 'qwen/qwen3-8b', name: 'Qwen: Qwen3 8B' },
    { id: 'qwen/qwen3-14b:free', name: 'Qwen: Qwen3 14B (free)' },
    { id: 'qwen/qwen3-14b', name: 'Qwen: Qwen3 14B' },
    { id: 'qwen/qwen3-32b', name: 'Qwen: Qwen3 32B' },
    { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen: Qwen3 235B A22B (free)' },
    { id: 'qwen/qwen3-235b-a22b', name: 'Qwen: Qwen3 235B A22B' },
    { id: 'tngtech/deepseek-r1t-chimera:free', name: 'TNG: DeepSeek R1T Chimera (free)' },
    { id: 'microsoft/mai-ds-r1:free', name: 'Microsoft: MAI DS R1 (free)' },
    { id: 'microsoft/mai-ds-r1', name: 'Microsoft: MAI DS R1' },
    { id: 'thudm/glm-z1-32b:free', name: 'THUDM: GLM Z1 32B (free)' },
    { id: 'thudm/glm-z1-32b', name: 'THUDM: GLM Z1 32B' },
    { id: 'thudm/glm-4-32b:free', name: 'THUDM: GLM 4 32B (free)' },
    { id: 'thudm/glm-4-32b', name: 'THUDM: GLM 4 32B' },
    { id: 'openai/o4-mini-high', name: 'OpenAI: o4 Mini High' },
    { id: 'openai/o3', name: 'OpenAI: o3' },
    { id: 'openai/o4-mini', name: 'OpenAI: o4 Mini' },
    { id: 'shisa-ai/shisa-v2-llama3.3-70b:free', name: 'Shisa AI: Shisa V2 Llama 3.3 70B (free)' },
    { id: 'shisa-ai/shisa-v2-llama3.3-70b', name: 'Shisa AI: Shisa V2 Llama 3.3 70B' },
    { id: 'openai/gpt-4.1', name: 'OpenAI: GPT-4.1' },
    { id: 'openai/gpt-4.1-mini', name: 'OpenAI: GPT-4.1 Mini' },
    { id: 'openai/gpt-4.1-nano', name: 'OpenAI: GPT-4.1 Nano' },
    { id: 'eleutherai/llemma_7b', name: 'EleutherAI: Llemma 7b' },
    { id: 'alfredpros/codellama-7b-instruct-solidity', name: 'AlfredPros: CodeLLaMa 7B Instruct Solidity' },
    { id: 'arliai/qwq-32b-arliai-rpr-v1:free', name: 'ArliAI: QwQ 32B RpR v1 (free)' },
    { id: 'arliai/qwq-32b-arliai-rpr-v1', name: 'ArliAI: QwQ 32B RpR v1' },
    { id: 'agentica-org/deepcoder-14b-preview:free', name: 'Agentica: Deepcoder 14B Preview (free)' },
    { id: 'agentica-org/deepcoder-14b-preview', name: 'Agentica: Deepcoder 14B Preview' },
    { id: 'moonshotai/kimi-vl-a3b-thinking:free', name: 'Moonshot AI: Kimi VL A3B Thinking (free)' },
    { id: 'moonshotai/kimi-vl-a3b-thinking', name: 'Moonshot AI: Kimi VL A3B Thinking' },
    { id: 'x-ai/grok-3-mini-beta', name: 'xAI: Grok 3 Mini Beta' },
    { id: 'x-ai/grok-3-beta', name: 'xAI: Grok 3 Beta' },
    { id: 'nvidia/llama-3.3-nemotron-super-49b-v1', name: 'NVIDIA: Llama 3.3 Nemotron Super 49B v1' },
    { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free', name: 'NVIDIA: Llama 3.1 Nemotron Ultra 253B v1 (free)' },
    { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', name: 'NVIDIA: Llama 3.1 Nemotron Ultra 253B v1' },
    { id: 'meta-llama/llama-4-maverick', name: 'Meta: Llama 4 Maverick' },
    { id: 'meta-llama/llama-4-scout', name: 'Meta: Llama 4 Scout' },
    { id: 'deepseek/deepseek-v3-base', name: 'DeepSeek: DeepSeek V3 Base' },
    { id: 'scb10x/llama3.1-typhoon2-70b-instruct', name: 'Typhoon2 70B Instruct' },
    { id: 'google/gemini-2.5-pro-exp-03-25', name: 'Google: Gemini 2.5 Pro Experimental' },
    { id: 'qwen/qwen2.5-vl-32b-instruct:free', name: 'Qwen: Qwen2.5 VL 32B Instruct (free)' },
    { id: 'qwen/qwen2.5-vl-32b-instruct', name: 'Qwen: Qwen2.5 VL 32B Instruct' },
    { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek: DeepSeek V3 0324 (free)' },
    { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek: DeepSeek V3 0324' },
    { id: 'featherless/qwerky-72b:free', name: 'Qrwkv 72B (free)' },
    { id: 'openai/o1-pro', name: 'OpenAI: o1-pro' },
    { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral: Mistral Small 3.1 24B (free)' },
    { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral: Mistral Small 3.1 24B' },
    { id: 'google/gemma-3-4b-it:free', name: 'Google: Gemma 3 4B (free)' },
    { id: 'google/gemma-3-4b-it', name: 'Google: Gemma 3 4B' },
  ],
  ollama: [
    { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B' },
    { id: 'llama3', name: 'Llama 3' },
    { id: 'phi3', name: 'Phi 3' },
  ],
};

interface ModelSelectorProps {
  selectedProvider: keyof typeof providerModels;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelector({ selectedProvider, selectedModel, onModelChange }: ModelSelectorProps) {
  const models = providerModels[selectedProvider] || [];

  return (
    <Select value={selectedModel} onValueChange={onModelChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {models.map(model => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}