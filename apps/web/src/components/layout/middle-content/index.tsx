"use client";

import { useParams, usePathname } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { ViewHeader } from './content-header';
import { usePageTree } from '@/hooks/usePageTree';
import { findNodeAndParent } from '@/lib/tree-utils';
import FolderView from './page-views/folder/FolderView';
import AiChatView from './page-views/ai-page/AiChatView';
import ChannelView from './page-views/channel/ChannelView';
import DocumentView from './page-views/document/DocumentView';
import { CustomScrollArea } from '@/components/ui/custom-scroll-area';
import { PageType } from '@pagespace/lib/client';
import AiSettingsView from './page-views/settings/AiSettingsView';
import VibePageView from './page-views/vibe/VibePageView';
import UserDashboardView from './page-views/dashboard/UserDashboardView';


const PageContent = ({ pageId }: { pageId: string | null }) => {
  const params = useParams();
  const pathname = usePathname();
  const driveSlug = params.driveSlug as string;
  const { tree, isLoading } = usePageTree(driveSlug);

  if (pathname.endsWith('/settings')) {
    return <AiSettingsView />;
  }

  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

  if (!pageId) {
    return <div className="p-4">Select a page to view its content.</div>;
  }

  const pageResult = findNodeAndParent(tree, pageId);

  if (!pageResult) {
    return <div className="p-4">Page not found in the current tree.</div>;
  }
  const { node: page } = pageResult;

  switch (page.type) {
    case PageType.FOLDER:
      return <FolderView key={page.id} page={page} />;
    case PageType.AI_CHAT:
      return <AiChatView key={page.id} page={page} />;
    case PageType.CHANNEL:
      return <ChannelView key={page.id} page={page} />;
    case PageType.DOCUMENT:
      return <DocumentView key={page.id} page={page} />;
    case PageType.DATABASE:
        return <div className="p-4">This page type is deprecated.</div>;
    case PageType.VIBE:
        return <VibePageView key={page.id} page={page} />;
    default:
      return <div className="p-4">This page type is not supported.</div>;
  }
};

export default function CenterPanel() {
    const params = useParams();
    const pathname = usePathname();
    const { driveSlug, pageId } = params;

  return (
    <div className="h-full flex flex-col">
        {pageId || pathname.endsWith('/settings') ? (
            <>
              <ViewHeader />
              <CustomScrollArea className="flex-1">
                <PageContent pageId={pageId as string} />
              </CustomScrollArea>
            </>
        ) : (
          <CustomScrollArea className="h-full p-4">
            {!driveSlug ? (
              <UserDashboardView />
            ) : (
              <>
                <UserDashboardView />
              </>
            )}
          </CustomScrollArea>
        )}
    </div>
  );
}