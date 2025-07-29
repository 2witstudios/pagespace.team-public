'use client';

import { useEffect, useState } from 'react';
import { useAssistantStore, AssistantConversation } from '@/stores/useAssistantStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from 'ai/react';

interface DashboardAssistantHistoryProps {
  setMessages: (messages: Message[]) => void;
  setActiveTab: (tab: string) => void;
}

export default function DashboardAssistantHistory({
  setMessages,
  setActiveTab,
}: DashboardAssistantHistoryProps) {
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const { setActiveConversation } = useAssistantStore();

  useEffect(() => {
    fetch('/api/ai/dashboard-assistant/conversations')
      .then(res => res.json())
      .then(data => setConversations(data));
  }, []);

  const handleConversationSelect = async (conversationId: string) => {
    setActiveConversation(conversationId);
    const response = await fetch(`/api/ai/dashboard-assistant/conversations/${conversationId}`);
    const data = await response.json();
    if (data.messages) {
      setMessages(data.messages);
      setActiveTab('assistant');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">History</h3>
      </div>
      <ScrollArea className="flex-1 h-0">
        <div className="p-4 space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer w-full overflow-hidden"
              onClick={() => handleConversationSelect(conv.id)}
            >
              <div className="w-0 flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}