import { Message } from 'ai/react';

export const classifyAssistantMessage = (
  message: Message,
): 'text' | 'tool' => {
  if (message.role !== 'assistant') {
    return 'text';
  }

  // Check for tool invocation in message parts
  if (
    message.parts &&
    message.parts.some((part) => part.type === 'tool-invocation')
  ) {
    return 'tool';
  }

  // Check for ai-diff in content for backward compatibility
  if (message.content.includes('<ai-diff>')) {
    return 'tool';
  }

  return 'text';
};