'use client';

import { useState, useEffect } from 'react';

export default function ThinkingIndicator() {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.';
        if (prev === '..') return '...';
        if (prev === '.') return '..';
        return '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm text-foreground/80 mt-1 pr-10">
      <span>AI is thinking{dots}</span>
    </div>
  );
}