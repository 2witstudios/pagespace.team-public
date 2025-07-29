"use client";

import { useChat } from 'ai/react';
import { useAuth } from './use-auth';
import { useAssistantStore } from '@/stores/useAssistantStore';
import { useDocumentStore } from '@/stores/useDocumentStore';

export const useDashboardAssistant = () => {
  const { user } = useAuth();
  const { model, assistantMode } = useAssistantStore();
  const { content: documentContent } = useDocumentStore();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    setMessages,
    error,
  } = useChat({
    api: '/api/ai/dashboard-assistant/messages',
    body: {
      model,
      assistantMode,
      documentContent,
    },
    onResponse: (response) => {
      const conversationId = response.headers.get('X-Conversation-Id');
      if (conversationId) {
        useAssistantStore.getState().setActiveConversation(conversationId);
      }
    },
  });

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    setMessages,
    error,
    user,
  };
};