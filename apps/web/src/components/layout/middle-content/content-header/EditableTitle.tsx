'use client';

import { useState, useEffect, useRef } from 'react';
import { useSWRConfig } from 'swr';
import { findNodeAndParent } from '@/lib/tree-utils';
import { usePageStore } from '@/hooks/usePage';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { usePageTree } from '@/hooks/usePageTree';
import { useParams } from 'next/navigation';

export function EditableTitle() {
  const pageId = usePageStore((state) => state.pageId);
  const { mutate } = useSWRConfig();
  const params = useParams();
  const driveSlug = params.driveSlug as string;
  const { tree, updateNode, isLoading } = usePageTree(driveSlug);
  const pageResult = pageId ? findNodeAndParent(tree, pageId) : null;
  const page = pageResult?.node;
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(page?.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
    }
  }, [page]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleTitleClick = () => {
    if (!isLoading) {
      setIsEditing(true);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const updateTitle = async () => {
    if (!page || title === page.title || isLoading) {
      setIsEditing(false);
      return;
    }

    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to update title');
      }

      const updatedPage = await response.json();
      updateNode(updatedPage.id, { title: updatedPage.title });
      mutate(`/api/pages/${page.id}/breadcrumbs`);
      toast.success('Title updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update title');
      // Revert title on error
      setTitle(page.title);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateTitle();
    } else if (e.key === 'Escape') {
      setTitle(page?.title || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={title}
        onChange={handleTitleChange}
        onBlur={updateTitle}
        onKeyDown={handleKeyDown}
        className="text-2xl font-bold h-auto p-0 border-none focus-visible:ring-0"
      />
    );
  }

  return (
    <h1 onClick={handleTitleClick} className="text-2xl font-bold cursor-pointer">
      {page?.title}
    </h1>
  );
}