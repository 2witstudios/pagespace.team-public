'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface ApiKeyInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSet: boolean;
}

export default function ApiKeyInput({ value, onChange, isSet }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showKey ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={isSet ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : 'Enter your API key'}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute inset-y-0 right-0 h-full"
        onClick={() => setShowKey(!showKey)}
      >
        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}