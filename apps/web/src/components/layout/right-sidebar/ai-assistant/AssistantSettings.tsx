'use client';

import { useEffect } from 'react';
import { useAiSettings } from '@/hooks/useAiSettings';
import { useAssistantStore } from '@/stores/useAssistantStore';
import { useDriveStore } from '@/hooks/useDrive';
import { ChatSettings } from '../../middle-content/content-header/ChatSettings';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AssistantSettings() {
  const { activeConversationId, model, setModel, createConversation } = useAssistantStore();
  const { currentDriveId } = useDriveStore();
  
  const aiSettings = useAiSettings({
    conversationId: activeConversationId || undefined,
    context: 'assistant',
  });

  // Initialize with suggested default model if no model is set or current model is not available
  useEffect(() => {
    if (!aiSettings.providersLoading && aiSettings.suggestedDefaultModel && aiSettings.availableModels.length > 0) {
      const isCurrentModelAvailable = aiSettings.availableModels.some(m => m.value === model);
      
      if (!isCurrentModelAvailable && aiSettings.suggestedDefaultModel) {
        const isSuggestedAvailable = aiSettings.availableModels.some(m => m.value === aiSettings.suggestedDefaultModel);
        if (isSuggestedAvailable) {
          setModel(aiSettings.suggestedDefaultModel);
        }
      }
    }
  }, [aiSettings.providersLoading, aiSettings.suggestedDefaultModel, aiSettings.availableModels, model, setModel]);

  const handleModelChange = async (newModel: string) => {
    try {
      setModel(newModel);
      
      let conversationId = activeConversationId;
      if (!conversationId) {
        if (!currentDriveId) {
          toast.error("No active drive. Please select a drive first.");
          return;
        }
        conversationId = await createConversation(currentDriveId, newModel);
      }
      
      await aiSettings.updateModel(newModel);
      toast.success('Model updated successfully!');
    } catch (error) {
      console.error('Failed to update model:', error);
      toast.error('Failed to update model.');
      setModel(aiSettings.currentSettings?.model || aiSettings.suggestedDefaultModel || 'ollama:qwen3:8b');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">AI Settings</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Model</label>
        <ChatSettings
          availableModels={aiSettings.availableModels}
          currentModel={model}
          onModelChange={handleModelChange}
          isLoading={aiSettings.settingsLoading}
          suggestedDefaultModel={aiSettings.suggestedDefaultModel}
        />
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-2">
          Manage API keys and provider settings
        </p>
        <Link href="/dashboard/settings/ai">
          <Button variant="outline" size="sm">
            AI Provider Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}