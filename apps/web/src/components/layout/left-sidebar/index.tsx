'use client';

import PageTree from "./page-tree/PageTree";
import { Button } from "@/components/ui/button";
import { Trash2, Search, Plus } from "lucide-react";
import { useState } from "react";
import CreatePageDialog from "./CreatePageDialog";
import { Input } from "@/components/ui/input";
import { useParams } from "next/navigation";
import { useSWRConfig } from "swr";
import DriveList from "./DriveList";
import Link from "next/link";
import DriveSwitcher from "./workspace-selector";

export default function Sidebar() {
    const [isCreatePageOpen, setCreatePageOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const params = useParams();
    const { driveSlug: driveSlugParams } = params;

    const driveSlug = Array.isArray(driveSlugParams) ? driveSlugParams[0] : driveSlugParams;
    const { mutate } = useSWRConfig();

    const trashLinkHref = driveSlug ? `/dashboard/${driveSlug}/trash` : '/dashboard';

    const handlePageCreated = () => {
        if (driveSlug) {
            mutate(`/api/drives/${driveSlug}/pages`);
        }
    };

  return (
    <aside className="hidden sm:block w-80 border-r bg-sidebar text-sidebar-foreground h-full">
      <div className="flex h-full flex-col gap-2 px-1 py-2">
        <DriveSwitcher />
        <div className="flex-1 overflow-auto py-2">
            {driveSlug ? (
                 <>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <div className="relative flex-grow">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search pages..."
                                className="pl-8 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setCreatePageOpen(true)}>
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                    <PageTree driveSlug={driveSlug as string} searchQuery={searchQuery} />
                </>
            ) : (
                 <DriveList />
            )}
        </div>
        <div className="mt-auto">
            {driveSlug && (
                <Link href={trashLinkHref} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-sm">
                    <Trash2 className="h-4 w-4" />
                    Trash
                </Link>
            )}
        </div>
        <CreatePageDialog
            parentId={null}
            isOpen={isCreatePageOpen}
            setIsOpen={setCreatePageOpen}
            onPageCreated={handlePageCreated}
            driveSlug={driveSlug as string}
        />
      </div>
    </aside>
  );
}