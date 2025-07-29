'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// This will be expanded with a proper provider configuration later
const providers = [
  { id: 'google', name: 'Google' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'ollama', name: 'Ollama' },
];

interface ProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (providerId: string) => void;
}

export default function ProviderSelector({ selectedProvider, onProviderChange }: ProviderSelectorProps) {
  return (
    <Select value={selectedProvider} onValueChange={onProviderChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a provider" />
      </SelectTrigger>
      <SelectContent>
        {providers.map(provider => (
          <SelectItem key={provider.id} value={provider.id}>
            {provider.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}