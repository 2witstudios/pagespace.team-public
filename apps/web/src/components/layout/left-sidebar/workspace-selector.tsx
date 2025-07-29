"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDriveStore } from "@/hooks/useDrive";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import CreateDriveDialog from "@/components/layout/left-sidebar/CreateDriveDialog";
import { Drive } from "@pagespace/lib";

export default function DriveSwitcher() {
  const router = useRouter();
  const params = useParams();
  const {
    drives,
    fetchDrives,
    isLoading,
    currentDriveId,
    setCurrentDrive,
  } = useDriveStore();
  const [isCreateDriveOpen, setCreateDriveOpen] = useState(false);
  const { user: sessionUser } = useAuth();

  const { driveSlug } = params;
  const urlDriveSlug = Array.isArray(driveSlug) ? driveSlug[0] : driveSlug;

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  useEffect(() => {
    if (urlDriveSlug && drives.length > 0) {
      const currentDrive = drives.find((d) => d.slug === urlDriveSlug);
      if (currentDrive) {
        setCurrentDrive(currentDrive.id);
      }
    } else if (!urlDriveSlug) {
      setCurrentDrive(null);
    }
  }, [urlDriveSlug, drives, setCurrentDrive]);

  const currentDrive = useMemo(
    () => drives.find((d) => d.id === currentDriveId),
    [drives, currentDriveId]
  );

  const handleSelectDrive = (drive: Drive) => {
    setCurrentDrive(drive.id);
    router.push(`/dashboard/${drive.slug}`);
  };

  const { ownedDrives, sharedDrives } = useMemo(() => {
    const owned: Drive[] = [];
    const shared: Drive[] = [];
    drives.forEach((d) => {
      if (d.ownerId === sessionUser?.id) {
        owned.push(d);
      } else {
        shared.push(d);
      }
    });
    return { ownedDrives: owned, sharedDrives: shared };
  }, [drives, sessionUser?.id]);

  if (isLoading) {
    return <Skeleton className="h-9 w-full" />;
  }

  return (
    <>
      <DropdownMenu>
        <div className="flex items-center gap-2 p-2">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <Link href={currentDrive ? `/dashboard/${currentDrive.slug}` : '/dashboard'} className="font-semibold truncate hover:underline">
            {currentDrive ? currentDrive.name : "Select a drive"}
          </Link>
        </div>
        <DropdownMenuContent className="w-56">
          {ownedDrives.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Drive</DropdownMenuLabel>
              {ownedDrives.map((drive) => (
                <DropdownMenuItem
                  key={drive.id}
                  onSelect={() => handleSelectDrive(drive)}
                >
                  {drive.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
          {sharedDrives.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>Shared Drives</DropdownMenuLabel>
              {sharedDrives.map((drive) => (
                <DropdownMenuItem
                  key={drive.id}
                  onSelect={() => handleSelectDrive(drive)}
                >
                  {drive.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
          {drives.length === 0 && (
             <DropdownMenuItem disabled>No drives found</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreateDriveOpen(true)}>
            Create Drive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateDriveDialog
        isOpen={isCreateDriveOpen}
        setIsOpen={setCreateDriveOpen}
      />
    </>
  );
}