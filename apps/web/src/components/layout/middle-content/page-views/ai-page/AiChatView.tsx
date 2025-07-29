'use client';

import { useChat } from 'ai/react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo, useState, useRef } from 'react';
import { TreePage, MessageWithUser } from '@/hooks/usePageTree';
import { Edit2, Copy, RefreshCw, Settings } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { renderMessageParts, convertToMessageParts, MessagePart } from '@/components/messages/MessagePartRenderer';
import ChatInput, { ChatInputRef } from '@/components/messages/ChatInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Define a more specific type for messages that include the user
type User = {
  id: string;
  name: string | null;
  image: string | null;
};

type DetailedPage = TreePage & { messages: MessageWithUser[] };

interface ChatViewProps {
  page: TreePage; // Initial page data, may not have messages
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ChatInterface({ page: initialPage }: { page: DetailedPage }) {
  const { user } = useAuth();
  const router = useRouter();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  const model = initialPage.aiChat?.model;

  // Create a lookup map for historical message senders for efficiency
  const messageSenderMap = useMemo(() => {
    return new Map((initialPage.messages || []).map((msg: MessageWithUser) => [msg.id, msg.user]));
  }, [initialPage.messages]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    reload,
    isLoading,
  } =
    useChat({
      api: `/api/ai/ai-page/messages/${initialPage.id}`,
      initialMessages: (initialPage.messages || []).map((m: MessageWithUser) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        createdAt: new Date(m.createdAt),
      })),
      body: {
        model: model,
      },
      maxSteps: 5,
      onError: (error) => {
        console.error('Chat error:', error);
        
        // Check if it's an API key error
        if (error.message && error.message.includes('API key')) {
          const providerMatch = error.message.match(/(Google|OpenAI|Anthropic|OpenRouter)/i);
          const provider = providerMatch ? providerMatch[1] : 'AI provider';
          setApiKeyError(`${provider} API key is not configured. Please add your API key in settings to continue.`);
          
          toast.error(`${provider} API key not configured`, {
            description: 'Click here to go to settings',
            action: {
              label: 'Settings',
              onClick: () => router.push('/dashboard/settings'),
            },
          });
        } else if (error.message && error.message.includes('No model configured')) {
            setApiKeyError('No model configured for this chat. Please select a model in settings.');
            toast.error('No model configured', {
                description: 'Click here to go to settings',
                action: {
                    label: 'Settings',
                    onClick: () => router.push('/dashboard/settings'),
                },
            });
        } else {
          toast.error('Failed to send message. Please try again.');
        }
      },
    });

  const getSender = (message: (typeof messages)[0]): User | null => {
    if (message.role === 'assistant') return null;
    if (messageSenderMap.has(message.id)) {
      return messageSenderMap.get(message.id) ?? null;
    }
    if (message.role === 'user') {
      return user as unknown as User | null;
    }
    return null;
  };

  const handleEditClick = (message: (typeof messages)[0]) => {
    setEditingMessageId(message.id);
    setEditedContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId) return;

    const messageIndex = messages.findIndex((m) => m.id === editingMessageId);
    if (messageIndex === -1) return;

    const editedMessage = messages[messageIndex];
    if (!editedMessage.createdAt) return; // Should always have a date

    // Create a new messages array up to the point of the edited message
    const newMessages = messages.slice(0, messageIndex);

    // Add a new user message with the edited content
    newMessages.push({
      ...editedMessage,
      content: editedContent,
    });

    // Update the chat state and trigger a reload to get a new response
    setMessages(newMessages);
    reload({
      body: {
        isEdit: true,
        editedMessageCreatedAt: editedMessage.createdAt.toISOString(),
      },
    });

    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleRegenerate = (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    const messageToRegenerate = messages[messageIndex];

    if (
      messageIndex === -1 ||
      messageToRegenerate.role !== 'assistant' ||
      !messageToRegenerate.createdAt
    )
      return;

    // Find the user message that prompted this assistant response
    const userMessageIndex = messages
      .slice(0, messageIndex)
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (userMessageIndex === -1) return;

    // The actual index in the original array
    const originalUserIndex = messageIndex - 1 - userMessageIndex;

    const newMessages = messages.slice(0, originalUserIndex + 1);
    setMessages(newMessages);
    reload({
      body: {
        isRegenerate: true,
        regeneratedMessageCreatedAt:
          messageToRegenerate.createdAt.toISOString(),
      },
    });
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    if (!model) {
      setApiKeyError('No model configured for this chat. Please select a model in settings.');
      toast.error('No model configured', {
        description: 'Click here to go to settings',
        action: {
          label: 'Settings',
          onClick: () => router.push('/dashboard/settings'),
        },
      });
      return;
    }
    handleSubmit();
    chatInputRef.current?.clear();
  };

  return (
    <div className="flex flex-col h-full">
      {apiKeyError && (
        <Alert className="m-4 mb-0 border-orange-200 bg-orange-50">
          <Settings className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{apiKeyError}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/dashboard/settings')}
              className="ml-4"
            >
              Go to Settings
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {messages.map((m, index) => {
              const sender = getSender(m);
              const senderName =
                m.role === 'assistant' ? 'AI Assistant' : sender?.name ?? 'You';
              const senderAvatar =
                m.role === 'assistant' ? null : sender?.image ?? null;
              const isEditing = editingMessageId === m.id;
              const isLastAssistantMessage =
                m.role === 'assistant' && index === messages.length - 1;
              const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];
              const isLastUserMessage = m.id === lastUserMessage?.id;

              return (
                <div key={m.id} className="flex items-start gap-4 group">
                  <Avatar className="w-8 h-8 border">
                    <AvatarImage src={senderAvatar ?? undefined} />
                    <AvatarFallback>
                      {senderName.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{senderName}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleTimeString()
                          : ''}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <Textarea
                          value={editedContent}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setEditedContent(e.target.value)
                          }
                          className="bg-background border-border focus:ring-ring text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSaveEdit}
                          >
                            Save & Submit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-foreground relative pr-20">
                        {(() => {
                          // Convert message to standardized parts format
                          let parts: MessagePart[];
                          
                          if (m.role === 'assistant' && m.parts) {
                            // AI message with existing parts structure
                            parts = m.parts.map(part => {
                              if (part.type === 'text') {
                                return {
                                  type: 'text' as const,
                                  text: (part as { text: string }).text
                                };
                              } else if (part.type === 'tool-invocation') {
                                return {
                                  type: 'tool-invocation' as const,
                                  toolInvocation: (part as { toolInvocation: { toolName: string; args: Record<string, unknown> } }).toolInvocation
                                };
                              } else {
                                // Skip unknown part types (like step-start, step-end, etc.)
                                return null;
                              }
                            }).filter(part => part !== null) as MessagePart[];
                          } else if (m.role === 'user') {
                            // User message - treat as rich text for mention support
                            parts = convertToMessageParts(m.content);
                          } else {
                            // AI message without parts - treat as plain text
                            parts = convertToMessageParts(m.content);
                          }
                          
                          return renderMessageParts(parts, 'message');
                        })()}
                        <div className="absolute top-0 right-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {m.role === 'user' && isLastUserMessage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditClick(m)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {isLastAssistantMessage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRegenerate(m.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              navigator.clipboard.writeText(m.content)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 border-t">
        <div className="flex w-full items-center space-x-2">
          <ChatInput
            ref={chatInputRef}
            value={input}
            onChange={(value) => handleInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)}
            onSendMessage={handleSendMessage}
            placeholder="Type your message... (use @ to mention)"
            driveId={initialPage.driveId}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChatView({ page }: ChatViewProps) {
  const { data: detailedPage, error } = useSWR<DetailedPage>(
    page ? `/api/pages/${page.id}` : null,
    fetcher
  );

  if (error) return <div>Failed to load chat.</div>;
  if (!detailedPage) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return <ChatInterface page={detailedPage} />;
}