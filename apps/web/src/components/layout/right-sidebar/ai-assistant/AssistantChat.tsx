'use client';

import { Message as UIMessage, UseChatHelpers } from 'ai/react';

interface Message extends UIMessage {
  toolCallActioned?: boolean;
}
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssistantStore } from '@/stores/useAssistantStore';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { usePageStore } from '@/hooks/usePage';
import { usePageTree } from '@/hooks/usePageTree';
import { findNodeAndParent } from '@/lib/tree-utils';
import { PlusSquare, Edit2, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useDriveStore } from '@/hooks/useDrive';
import { useState, useRef, useEffect, useCallback } from 'react';
import { renderMessageParts, MessagePart } from '@/components/messages/MessagePartRenderer';
import { useAuth } from '@/hooks/use-auth';
import ChatInput, { ChatInputRef } from '@/components/messages/ChatInput';
import AiDiffSheet from '@/components/ai/AiDiffSheet';
import ThinkingIndicator from '@/components/ai/ThinkingIndicator';
import ToolOutput from '@/components/ai/ToolOutput';
import { applyAiDiff, extractValidXml } from '@/lib/ai-diff';
import { classifyAssistantMessage } from '@/lib/assistant-utils';

interface AssistantChatProps {
  chat: UseChatHelpers;
}

export default function AssistantChat({ chat }: AssistantChatProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { drives, currentDriveId } = useDriveStore();
  const currentDrive = drives.find((d) => d.id === currentDriveId);
  const pageId = usePageStore((state) => state.pageId);
  const { tree } = usePageTree(currentDrive?.slug);
  const pageResult = pageId ? findNodeAndParent(tree, pageId) : null;
  const page = pageResult?.node;
  const {
    activeConversationId,
    assistantMode,
    setAssistantMode,
  } = useAssistantStore();
  const { content: documentContent, setContent: setDocumentContent } = useDocumentStore();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [diffPreview, setDiffPreview] = useState<{ messageId: string; original: string; newContent: string; isApproximateMatch: boolean; } | null>(null);
  const [extractedDiff, setExtractedDiff] = useState<Record<string, string>>({});
  const [messageTypes, setMessageTypes] = useState<Record<string, 'text' | 'tool'>>({});
  const [toolCallStatus, setToolCallStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [toolCallErrors, setToolCallErrors] = useState<Record<string, string>>({});
  const chatInputRef = useRef<ChatInputRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    reload,
    setMessages,
    isLoading,
  } = chat;

  useEffect(() => {
    const newTypes: Record<string, 'text' | 'tool'> = {};
    const newDiffs: Record<string, string> = {};

    messages.forEach(m => {
      const type = classifyAssistantMessage(m);
      newTypes[m.id] = type;

      if (type === 'tool') {
        const xml = extractValidXml(m.content);
        if (xml) {
          newDiffs[m.id] = xml;
        }
      }
    });

    setMessageTypes(newTypes);
    setExtractedDiff(newDiffs);
  }, [messages]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePreview = useCallback((messageId: string) => {
    const content = typeof documentContent === 'string' ? documentContent : '';
    setToolCallStatus(prev => ({ ...prev, [messageId]: 'pending' }));
    
    const result = applyAiDiff(content, extractedDiff[messageId]);
    if (result && 'newContent' in result) {
      setToolCallStatus(prev => ({ ...prev, [messageId]: 'success' }));
      setDiffPreview({
        messageId,
        original: content,
        newContent: result.newContent,
        isApproximateMatch: result.isApproximateMatch,
      });
    } else {
      setToolCallStatus(prev => ({ ...prev, [messageId]: 'error' }));
      const errorMessage = result && 'error' in result 
        ? `${result.error}${result.details ? ': ' + result.details : ''}`
        : 'Failed to apply AI suggestion. The original content may have changed or the diff format is invalid.';
      setToolCallErrors(prev => ({ 
        ...prev, 
        [messageId]: errorMessage
      }));
      toast.error(errorMessage);
    }
  }, [documentContent, extractedDiff]);

  const prevIsLoading = useRef(isLoading);

  useEffect(() => {
    if (prevIsLoading.current && !isLoading) {
      const lastMessage = messages[messages.length - 1] as Message;
      if (
        lastMessage &&
        lastMessage.role === 'assistant' &&
        extractedDiff[lastMessage.id] &&
        !lastMessage.toolCallActioned
      ) {
        handlePreview(lastMessage.id);
      }
    }
    prevIsLoading.current = isLoading;
  }, [isLoading, messages, extractedDiff, handlePreview]);



  const handleAccept = async () => {
    if (!diffPreview) return;

    setDocumentContent(diffPreview.newContent);
    
    await fetch(`/api/ai/ai-assistant/messages/${diffPreview.messageId}/action`, {
      method: 'POST',
    });

    const newMessages = messages.map(m =>
      m.id === diffPreview.messageId ? { ...m, toolCallActioned: true } : m
    );
    setMessages(newMessages);

    setDiffPreview(null);
    toast.success('Changes applied!');
  };

  const handleEditClick = (message: Message) => {
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
    if (!editedMessage.createdAt) return;

    const newMessages = messages.slice(0, messageIndex);
    newMessages.push({
      ...editedMessage,
      content: typeof editedContent === 'string' ? editedContent : JSON.stringify(editedContent),
    });

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
    if (messageIndex === -1) return;

    const messageToRegenerate = messages[messageIndex];
    if (
      messageToRegenerate.role !== 'assistant' ||
      !messageToRegenerate.createdAt
    )
      return;

    const userMessageIndex = messages
      .slice(0, messageIndex)
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (userMessageIndex === -1) return;

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

  const handlePromote = async () => {
    if (!activeConversationId || !page || !currentDrive) {
      toast.warning('Cannot promote an empty or uninitialized conversation.');
      return;
    }

    const promise = fetch('/api/ai/ai-assistant/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assistantConversationId: activeConversationId,
        parentPageId: page.id,
        driveId: currentDrive.id,
      }),
    });

    toast.promise(promise, {
      loading: 'Promoting conversation to page...',
      success: async (res) => {
        const { pageId, driveSlug } = await res.json();
        useAssistantStore.getState().clearConversation();
        router.push(`/dashboard/${driveSlug}/${pageId}`);
        return 'Conversation promoted successfully!';
      },
      error: 'Failed to promote conversation.',
    });
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    handleSubmit(undefined, {
      body: {
        documentContent: typeof documentContent === 'string' ? documentContent : '',
        assistantMode,
        driveId: currentDriveId,
        pageContext: {
          pageId: page?.id,
          pageTitle: page?.title,
          parentPageId: pageResult?.parent?.id,
        },
      },
    });
    chatInputRef.current?.clear();
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area - takes remaining space and creates scroll when needed */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 divide-y divide-border">
            {messages.map((m) => {
              const isEditing = editingMessageId === m.id;
              const isLastAssistantMessage =
                m.role === 'assistant' &&
                messages[messages.length - 1].id === m.id;
              const lastUserMessage = messages
                .filter((m) => m.role === 'user')
                .slice(-1)[0];
              const isLastUserMessage = m.id === lastUserMessage?.id;
              const senderName =
                m.role === 'assistant' ? 'Assistant' : user?.name ?? 'You';

              const messageType = messageTypes[m.id] || 'text';

              return (
                <div key={m.id} className="group relative py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">{senderName}:</span>
                      <span className="text-xs text-muted-foreground">
                        {m.createdAt &&
                          new Date(m.createdAt).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full p-2 border rounded"
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
                      <>
                        {m.role === 'assistant' && messageType === 'tool' ? (
                          <>
                            {isLoading && isLastAssistantMessage ? (
                              <ThinkingIndicator />
                            ) : (
                              <>
                                {(m as Message).toolCallActioned ? (
                                  <ToolOutput xml={extractedDiff[m.id]} />
                                ) : (
                                  <>
                                    {toolCallStatus[m.id] === 'error' ? (
                                      <div className="mt-2">
                                        <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-md">
                                          <p className="text-sm text-destructive font-medium">Tool Call Failed</p>
                                          <p className="text-xs text-destructive/80 mt-1">
                                            {toolCallErrors[m.id] || 'Unknown error occurred'}
                                          </p>
                                        </div>
                                      </div>
                                    ) : toolCallStatus[m.id] === 'pending' ? (
                                      <Button disabled className="mt-2 w-full">
                                        Processing...
                                      </Button>
                                    ) : (
                                      <Button onClick={() => handlePreview(m.id)} className="mt-2 w-full">
                                        Preview & Apply Changes
                                      </Button>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-foreground/80 mt-1 pr-10 whitespace-pre-wrap break-words">
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
                              } else {
                                // User message or AI message without parts - treat as rich text for mention support
                                parts = [{
                                  type: 'rich-text',
                                  content: m.content
                                }];
                              }
                              
                              return renderMessageParts(parts, 'message');
                            })()}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 hidden group-hover:flex items-center">
                          {m.role === 'user' && isLastUserMessage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditClick(m)}
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          {isLastAssistantMessage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRegenerate(m.id)}
                            >
                              <RefreshCw className="h-4 w-4 text-muted-foreground" />
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
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="group relative py-4">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm">Assistant:</span>
                  </div>
                  <ThinkingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      
      {/* Input area - fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t">
        <div className="flex items-center justify-center mb-2">
          <div className="flex items-center rounded-full bg-muted p-0.5 text-xs">
            <Button
              type="button"
              onClick={() => setAssistantMode('write')}
              className={`rounded-full px-2 h-6 text-xs ${
                assistantMode === 'write'
                  ? 'bg-background text-foreground'
                  : 'bg-transparent text-muted-foreground'
              }`}
            >
              Write
            </Button>
            <Button
              type="button"
              onClick={() => setAssistantMode('ask')}
              className={`rounded-full px-2 h-6 text-xs ${
                assistantMode === 'ask'
                  ? 'bg-background text-foreground'
                  : 'bg-transparent text-muted-foreground'
              }`}
            >
              Ask
            </Button>
          </div>
        </div>
        <div className="flex w-full items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePromote}
            disabled={!activeConversationId}
          >
            <PlusSquare className="h-5 w-5" />
          </Button>
          <ChatInput
            ref={chatInputRef}
            value={input}
            onChange={(value) => handleInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)}
            onSendMessage={handleSendMessage}
            placeholder="Ask the AI..."
            driveId={currentDriveId || undefined}
          />
          <Button
            type="submit"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            Send
          </Button>
        </div>
      </div>
      {diffPreview && (
        <AiDiffSheet
          isOpen={!!diffPreview}
          onClose={() => {
            if (diffPreview) {
              setDiffPreview(null);
            }
          }}
          onAccept={handleAccept}
          originalContent={diffPreview.original}
          newContent={diffPreview.newContent}
          isApproximateMatch={diffPreview.isApproximateMatch}
        />
      )}
    </div>
  );
}