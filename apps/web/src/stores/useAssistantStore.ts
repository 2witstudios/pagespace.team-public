import { create } from 'zustand';
import { Message } from 'ai/react';

export interface AssistantConversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface AssistantState {
  activeConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  model: string;
  assistantMode: 'write' | 'ask';
  setAssistantMode: (mode: 'write' | 'ask') => void;
  setModel: (model: string) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearConversation: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  activeConversationId: null,
  messages: [],
  isLoading: false,
  model: 'ollama:qwen3:8b',
  assistantMode: 'write',
  setAssistantMode: (mode) => set({ assistantMode: mode }),
  setModel: (model) => set({ model }),
  setActiveConversation: (id) => set({ activeConversationId: id, messages: [], isLoading: true }),
  setMessages: (messages) => set({ messages, isLoading: false }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearConversation: () => set({ activeConversationId: null, messages: [] }),
}));