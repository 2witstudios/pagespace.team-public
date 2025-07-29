'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';

export type Setting = {
  id: string;
  provider: string;
  isConfigured: boolean;
  updatedAt: Date;
  baseUrl?: string | null;
};

interface ProviderSettingsProps {
  initialSettings: Setting[];
}

const ALL_PROVIDERS = ['ollama', 'google', 'openai', 'anthropic', 'openrouter'];

const PROVIDER_LABELS = {
  google: 'Google',
  openai: 'OpenAI', 
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter',
  ollama: 'Ollama'
};

export function ProviderSettings({ initialSettings }: ProviderSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>(() => {
    const initialUrls: Record<string, string> = {};
    const ollamaSetting = initialSettings.find(s => s.provider === 'ollama');
    initialUrls.ollama = ollamaSetting?.baseUrl || 'http://host.docker.internal:11434';
    return initialUrls;
  });
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { mutate } = useSWRConfig();

  const handleUpdate = (updatedSetting: Setting) => {
    setSettings(currentSettings => {
      const index = currentSettings.findIndex(s => s.provider === updatedSetting.provider);
      if (index > -1) {
        const newSettings = [...currentSettings];
        newSettings[index] = updatedSetting;
        return newSettings;
      }
      return [...currentSettings, updatedSetting];
    });
  };

  const handleSave = async (provider: string) => {
    const isOllama = provider === 'ollama';
    const apiKey = apiKeys[provider];
    const baseUrl = baseUrls[provider];

    if (isOllama ? !baseUrl : !apiKey) return;

    setLoadingStates(prev => ({ ...prev, [provider]: true }));
    try {
      const body = isOllama ? { provider, baseUrl } : { provider, apiKey };
      const response = await fetch('/api/ai/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const updatedSetting = await response.json();
      if (!response.ok) {
        throw new Error(updatedSetting.error?.message || `Failed to save ${isOllama ? 'Base URL' : 'API key'}.`);
      }
      handleUpdate(updatedSetting);
      mutate('/api/ai/user-settings');
      toast.success(`${PROVIDER_LABELS[provider as keyof typeof PROVIDER_LABELS]} ${isOllama ? 'Base URL' : 'API key'} saved successfully.`);
      if (isOllama) {
        setBaseUrls(prev => ({ ...prev, [provider]: baseUrl || '' }));
      } else {
        setApiKeys(prev => ({ ...prev, [provider]: '' }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingStates(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleRemove = async (provider: string) => {
    setLoadingStates(prev => ({ ...prev, [provider]: true }));
    try {
      const response = await fetch('/api/ai/user-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const updatedSetting = await response.json();
      if (!response.ok) {
        throw new Error(updatedSetting.error?.message || 'Failed to remove API key.');
      }
      handleUpdate(updatedSetting);
      mutate('/api/ai/user-settings');
      toast.success(`${PROVIDER_LABELS[provider as keyof typeof PROVIDER_LABELS]} settings removed successfully.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingStates(prev => ({ ...prev, [provider]: false }));
    }
  };

  const mergedSettings = ALL_PROVIDERS.map(provider => {
    const existingSetting = settings.find(s => s.provider === provider);
    return existingSetting || {
      id: '',
      provider,
      isConfigured: false,
      updatedAt: new Date(),
      baseUrl: null,
    };
  });

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Configuration</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mergedSettings.map(setting => (
            <TableRow key={setting.provider}>
              <TableCell className="font-medium">
                {PROVIDER_LABELS[setting.provider as keyof typeof PROVIDER_LABELS]}
              </TableCell>
              <TableCell>
                <Badge variant={setting.isConfigured ? 'default' : 'secondary'}>
                  {setting.isConfigured ? 'Configured' : 'Not Set'}
                </Badge>
              </TableCell>
              <TableCell>
                {setting.provider === 'ollama' ? (
                  <Input
                    type="text"
                    value={baseUrls[setting.provider] || ''}
                    onChange={(e) => setBaseUrls(prev => ({
                      ...prev,
                      [setting.provider]: e.target.value
                    }))}
                    placeholder="http://host.docker.internal:11434"
                    className="max-w-xs"
                  />
                ) : (
                  <Input
                    type="password"
                    value={apiKeys[setting.provider] || ''}
                    onChange={(e) => setApiKeys(prev => ({
                      ...prev,
                      [setting.provider]: e.target.value
                    }))}
                    placeholder="Enter API key"
                    className="max-w-xs"
                  />
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave(setting.provider)}
                    disabled={loadingStates[setting.provider] || (setting.provider === 'ollama' ? !baseUrls[setting.provider] : !apiKeys[setting.provider])}
                  >
                    {loadingStates[setting.provider] ? 'Saving...' : 'Save'}
                  </Button>
                  {setting.isConfigured && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemove(setting.provider)}
                      disabled={loadingStates[setting.provider]}
                    >
                      {loadingStates[setting.provider] ? 'Removing...' : 'Remove'}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}