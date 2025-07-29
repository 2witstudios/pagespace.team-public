'use client';

import { ShareDialog } from './page-settings/ShareDialog';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { EditableTitle } from './EditableTitle';
import { usePageStore } from '@/hooks/usePage';
import { usePageTree } from '@/hooks/usePageTree';
import { findNodeAndParent } from '@/lib/tree-utils';
import { useParams } from 'next/navigation';
import { ChatSettings } from './ChatSettings';
import { useAiSettings } from '@/hooks/useAiSettings';
import { toast } from 'sonner';
import { EditorToggles } from './EditorToggles';

export function ViewHeader() {
  const pageId = usePageStore((state) => state.pageId);
  const params = useParams();
  const driveSlug = params.driveSlug as string;
  const { tree, updateNode } = usePageTree(driveSlug);

  const pageResult = pageId ? findNodeAndParent(tree, pageId) : null;
  const page = pageResult?.node;

  const isChatPage = page?.type === 'AI_CHAT';
  const isDocumentPage = page?.type === 'DOCUMENT';

  // Use the new AI settings hook for page-specific settings
  const aiSettings = useAiSettings({
    pageId: isChatPage && page ? page.id : undefined,
    context: 'page',
  });

  const handleModelChange = async (model: string) => {
    if (!page) return;

    try {
      await aiSettings.updateModel(model);
      
      // Update the page tree with the new model (only if aiChat exists)
      if (page.aiChat) {
        updateNode(page.id, { 
          ...page, 
          aiChat: { 
            ...page.aiChat, 
            model,
            providerOverride: model.split(':')[0]
          } 
        });
      }
      
      toast.success('Model updated successfully!');
    } catch (error) {
      console.error('Failed to update model:', error);
      toast.error('Failed to update model.');
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border-b bg-card">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <EditableTitle />
        <div className="flex items-center gap-2">
          {isDocumentPage && <EditorToggles />}
          {isChatPage && page && (
            <ChatSettings
              availableModels={aiSettings.availableModels}
              currentModel={aiSettings.currentSettings?.model || aiSettings.suggestedDefaultModel || 'ollama:qwen3:8b'}
              onModelChange={handleModelChange}
              isLoading={aiSettings.settingsLoading}
              suggestedDefaultModel={aiSettings.suggestedDefaultModel}
            />
          )}
          <ShareDialog />
          <Button variant="ghost" size="sm">
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}