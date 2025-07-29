'use client';

import { ProviderSettings } from '@/components/ai/ProviderSettings';
import { useAiSettings } from '@/hooks/useAiSettings';

export default function AiSettingsView() {
  // For global settings, we only need providers data, not specific chat settings
  const aiSettings = useAiSettings({ context: 'assistant' });

  if (aiSettings.providersLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">AI Provider Settings</h1>
        <p className="mb-8 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (aiSettings.providersError) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">AI Provider Settings</h1>
        <p className="mb-8 text-red-600">Error loading settings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">AI Provider Settings</h1>
      <p className="mb-8 text-muted-foreground">
        Manage your API keys for different AI providers. You can select which model to use for each AI chat individually.
        <br />
        <strong>Note:</strong> For Ollama, use <code>http://host.docker.internal:11434</code> for Docker setups or <code>http://localhost:11434</code> for local development.
      </p>
      <ProviderSettings
        initialSettings={aiSettings.providers}
      />
    </div>
  );
}