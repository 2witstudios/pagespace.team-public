'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { io, Socket } from 'socket.io-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TreePage, MessageWithUser } from '@/hooks/usePageTree';
import { renderMessageParts, convertToMessageParts } from '@/components/messages/MessagePartRenderer';
import ChatInput, { ChatInputRef } from '@/components/messages/ChatInput';

interface ChannelViewProps {
  page: TreePage;
}

export default function ChannelView({ page }: ChannelViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [inputValue, setInputValue] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch(`/api/channels/${page.id}/messages`);
      const data = await res.json();
      setMessages(data);
    };
    fetchMessages();
  }, [page.id]);

  useEffect(() => {
    if (!user) return;

    const socketUrl = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:3001';
    const socket = io(socketUrl, {
      auth: {
        token: document.cookie
          .split('; ')
          .find(row => row.startsWith('accessToken='))
          ?.split('=')[1],
      },
    });
    socketRef.current = socket;

    socket.emit('join_channel', page.id);

    const handleNewMessage = (message: MessageWithUser) => {
      setMessages((prev) => {
        // If the message is already in the list, don't add it again.
        if (prev.find((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev.filter(m => !m.id.startsWith('temp-')), message];
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.disconnect();
    };
  }, [page.id, user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (content: string) => {
    if (!user) return;

    const messageContent = typeof content === 'string' ? content : JSON.stringify(content);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: MessageWithUser = {
      id: tempId,
      pageId: page.id,
      content: messageContent,
      userId: user.id,
      createdAt: new Date(),
      role: 'user',
      toolCalls: {},
      toolResults: {},
      user: {
        id: user.id,
        name: user.name || 'You',
        image: null,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`/api/channels/${page.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!res.ok) {
        // If the API call fails, remove the optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        console.error('Failed to send message');
      }
      // The new message will be received via the socket connection,
      // which will replace the optimistic one.
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      console.error('Error sending message:', error);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    handleSubmit(inputValue);
    chatInputRef.current?.clear();
  };

  return (
    <div className="flex flex-col h-full">
        <div className="flex-grow overflow-hidden">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="p-4 space-y-4">
                    {messages.map((m) => (
                        <div key={m.id} className="flex items-start gap-4">
                            <Avatar>
                                <AvatarImage src={m.user?.image || ''} />
                                <AvatarFallback>{m.user?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{m.user?.name}</span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(m.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                {(() => {
                                  // Channel messages are always user messages with rich text support
                                  const parts = convertToMessageParts(m.content);
                                  return renderMessageParts(parts, 'message');
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
        <div className="p-4 border-t">
          <div className="flex w-full items-center space-x-2">
            <ChatInput
              ref={chatInputRef}
              value={inputValue}
              onChange={setInputValue}
              onSendMessage={handleSendMessage}
              placeholder="Type your message... (use @ to mention)"
              driveId={page.driveId}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              Send
            </Button>
          </div>
        </div>
    </div>
  );
}