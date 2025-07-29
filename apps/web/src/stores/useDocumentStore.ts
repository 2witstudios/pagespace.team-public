import { create } from 'zustand';

interface DocumentState {
  pageId: string | null;
  content: string;
  saveCallback: ((pageId: string, content: string) => Promise<void>) | null;
  activeView: 'rich' | 'code';
  setDocument: (pageId: string, content: string) => void;
  setContent: (newContent: string) => void;
  setSaveCallback: (callback: (pageId: string, content: string) => Promise<void>) => void;
  setActiveView: (view: 'rich' | 'code') => void;
}

let saveTimeoutId: NodeJS.Timeout | null = null;

export const useDocumentStore = create<DocumentState>((set, get) => ({
  pageId: null,
  content: '',
  saveCallback: null,
  activeView: 'rich',
  setDocument: (pageId, content) => set({ pageId, content, activeView: 'rich' }),
  setContent: (newContent) => {
    set({ content: newContent });
    
    const { pageId, saveCallback } = get();
    if (pageId && saveCallback) {
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
      
      saveTimeoutId = setTimeout(() => {
        saveCallback(pageId, newContent).catch(error => {
          console.error('Failed to save document:', error);
        });
      }, 1000);
    }
  },
  setSaveCallback: (callback) => set({ saveCallback: callback }),
  setActiveView: (view) => set({ activeView: view }),
}));