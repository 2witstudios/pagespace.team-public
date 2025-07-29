import { MentionSuggestion, MentionType } from '@/types/mentions';

export interface SuggestionApiError {
  message: string;
}

export interface SuggestionResult {
  suggestions: MentionSuggestion[];
  error?: SuggestionApiError;
}

export const suggestionApi = {
  fetchSuggestions: async (
    query: string,
    driveId: string,
    allowedTypes: MentionType[]
  ): Promise<SuggestionResult> => {
    try {
      const types = allowedTypes.join(',');
      const response = await fetch(
        `/api/mentions/search?q=${query}&driveId=${driveId}&types=${types}`
      );
      if (!response.ok) {
        return {
          suggestions: [],
          error: { message: 'Failed to fetch suggestions' },
        };
      }
      const data = await response.json();
      return { suggestions: data };
    } catch {
      return {
        suggestions: [],
        error: { message: 'Failed to fetch suggestions' },
      };
    }
  },
};