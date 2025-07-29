// Enhanced mention types for the flexible mention system

export type MentionType = 'page' | 'user' | 'ai-page' | 'ai-assistant' | 'channel';

export interface BaseMention {
  id: string;
  label: string;
  type: MentionType;
}

export interface PageMentionData {
  pageType: 'DOCUMENT' | 'FOLDER' | 'DATABASE' | 'CHANNEL' | 'AI_CHAT';
  driveId: string;
}

export interface UserMentionData {
  email: string;
  avatar?: string;
}

export interface AiPageMentionData {
  pageId: string;
  messageCount: number;
  lastActivity: Date;
  driveId: string;
}

export interface AssistantAIMentionData {
  conversationId: string;
  title: string;
  driveId: string;
  messageCount: number;
  lastActivity: Date;
}

export interface ChannelMentionData {
  pageId: string;
  memberCount: number;
  driveId: string;
}

export type MentionData = 
  | PageMentionData 
  | UserMentionData 
  | AiPageMentionData 
  | AssistantAIMentionData 
  | ChannelMentionData;

export interface EnhancedMention extends BaseMention {
  data: MentionData;
}

// Type-specific mention interfaces
export interface PageMention extends BaseMention {
  type: 'page';
  data: PageMentionData;
}

export interface UserMention extends BaseMention {
  type: 'user';
  data: UserMentionData;
}

export interface AiPageMention extends BaseMention {
  type: 'ai-page';
  data: AiPageMentionData;
}

export interface AssistantAIMention extends BaseMention {
  type: 'ai-assistant';
  data: AssistantAIMentionData;
}

export interface ChannelMention extends BaseMention {
  type: 'channel';
  data: ChannelMentionData;
}

// Union type for all specific mention types
export type TypedMention = 
  | PageMention 
  | UserMention 
  | AiPageMention 
  | AssistantAIMention 
  | ChannelMention;

// For search results and suggestions
export interface MentionSuggestion {
  id: string;
  label: string;
  type: MentionType;
  data: MentionData;
  description?: string; // Optional description for search results
}

