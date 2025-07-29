import { streamText, CoreMessage, tool, LanguageModelV1, ToolSet } from 'ai';
import { z } from 'zod';

/**
 * Common tools available across AI implementations
 * Currently includes weather tool - can be extended
 */
export const commonTools = {
  getWeather: tool({
    description: 'Get the weather in a location',
    parameters: z.object({
      location: z.string().describe('The location to get the weather for'),
    }),
    execute: async ({ location }) => {
      // Simulate fetching weather data
      const temperature = Math.round(Math.random() * (90 - 32) + 32);
      return {
        location,
        temperature,
        message: `The weather in ${location} is currently ${temperature}°F.`,
      };
    },
  }),
};

/**
 * Common streaming configuration
 * Extracted from existing working implementations
 */
export function createStreamConfig(params: {
  model: LanguageModelV1;
  systemPrompt: string;
  messages: CoreMessage[];
  temperature?: number;
  tools?: ToolSet;
  onFinish?: (result: { text: string; toolCalls: unknown; toolResults: unknown }) => Promise<void>;
}) {
  return streamText({
    model: params.model,
    system: params.systemPrompt,
    messages: params.messages,
    temperature: params.temperature || 0.7,
    tools: params.tools || commonTools,
    onFinish: params.onFinish,
  });
}