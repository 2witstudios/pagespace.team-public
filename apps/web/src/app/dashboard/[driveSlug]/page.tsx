"use client";

import { useParams } from 'next/navigation';
import { usePageTree } from '@/hooks/usePageTree';
import DriveView from '@/components/layout/middle-content/page-views/drive/DriveView';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomScrollArea } from '@/components/ui/custom-scroll-area';

export default function DrivePage() {
  const params = useParams();
  const driveSlug = params.driveSlug as string;
  const { tree, isLoading } = usePageTree(driveSlug);

  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <CustomScrollArea className="h-full">
      <DriveView pages={tree} />
    </CustomScrollArea>
  );
}