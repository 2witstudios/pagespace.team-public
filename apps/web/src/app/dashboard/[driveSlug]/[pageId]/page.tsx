"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePageStore } from '@/hooks/usePage';
import CenterPanel from '@/components/layout/middle-content';

export default function Page() {
  const params = useParams();
  const { setPageId } = usePageStore();
  const pageId = params.pageId as string;

  useEffect(() => {
    if (pageId) {
      setPageId(pageId);
    }
    // Set pageId to null when the component unmounts or pageId changes
    return () => {
      setPageId(null);
    };
  }, [pageId, setPageId]);

  return <CenterPanel />;
}