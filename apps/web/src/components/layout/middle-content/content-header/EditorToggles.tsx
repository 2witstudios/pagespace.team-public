"use client";

import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/stores/useDocumentStore';

export function EditorToggles() {
  const { activeView, setActiveView } = useDocumentStore();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={activeView === 'rich' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setActiveView('rich')}
      >
        Rich
      </Button>
      <Button
        variant={activeView === 'code' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setActiveView('code')}
      >
        Code
      </Button>
    </div>
  );
}