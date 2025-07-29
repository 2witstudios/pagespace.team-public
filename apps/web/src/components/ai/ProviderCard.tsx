'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Setting } from './ProviderSettings';

interface ProviderCardProps {
  provider: string;
  isApiKeySet: boolean;
  onUpdate: (setting: Setting) => void;
}

export function ProviderCard({ provider, isApiKeySet, onUpdate }: ProviderCardProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { mutate } = useSWRConfig();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      const updatedSetting = await response.json();
      if (!response.ok) {
        throw new Error(updatedSetting.error?.message || 'Failed to save API key.');
      }
      onUpdate(updatedSetting);
      mutate('/api/ai/user-settings');
      toast.success(`${provider} API key saved successfully.`);
      setApiKey('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
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
      onUpdate(updatedSetting);
      mutate('/api/ai/user-settings');
      toast.success(`${provider} API key removed successfully.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{provider}</CardTitle>
        <CardDescription>
          {isApiKeySet ? 'API key is set.' : 'API key is not set.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor={`api-key-${provider}`}>API Key</Label>
          <Input
            id={`api-key-${provider}`}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isLoading || !apiKey}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
          {isApiKeySet && (
            <Button onClick={handleRemove} variant="destructive" disabled={isLoading}>
              {isLoading ? 'Removing...' : 'Remove'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}