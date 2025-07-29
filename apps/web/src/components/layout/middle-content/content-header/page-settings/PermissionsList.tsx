'use client';

import { useEffect, useState } from 'react';
import { usePageStore } from '@/hooks/usePage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionAction, SubjectType } from '@pagespace/lib/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type Group = {
  id: string;
  name: string;
};

type EnrichedPermission = {
  id: string;
  action: PermissionAction;
  subjectType: SubjectType;
  subjectId: string;
  subject: User | Group;
};

type PermissionsData = {
  owner: User;
  permissions: EnrichedPermission[];
};

export function PermissionsList() {
  const pageId = usePageStore((state) => state.pageId);
  const [data, setData] = useState<PermissionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!pageId) return;

    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/pages/${pageId}/permissions`);
        if (!response.ok) {
          throw new Error('Failed to fetch permissions');
        }
        const result: PermissionsData = await response.json();
        setData(result);
      } catch (error) {
        console.error(error);
        toast.error('Could not load permissions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [pageId]);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const { owner, permissions } = data;

  const handlePermissionChange = async (
    permissionId: string,
    action: PermissionAction | 'REMOVE'
  ) => {
    const originalPermissions = data;
    // Optimistic update can be implemented here

    try {
      const url = `/api/pages/${pageId!}/permissions/${permissionId}`;
      const method = action === 'REMOVE' ? 'DELETE' : 'PUT';
      const body =
        action !== 'REMOVE' ? JSON.stringify({ action }) : undefined;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        throw new Error('Failed to update permission');
      }

      // Refresh data
      const updatedResponse = await fetch(`/api/pages/${pageId!}/permissions`);
      const updatedData = await updatedResponse.json();
      setData(updatedData);

      toast.success('Permission updated successfully.');
    } catch (error) {
      console.error(error);
      setData(originalPermissions); // Revert on error
      toast.error('Failed to update permission.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Existing Access</h3>
        <p className="text-sm text-muted-foreground">
          Manage who can see and edit this page.
        </p>
      </div>
      <div className="space-y-2">
        {/* Owner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={owner.image || ''} />
              <AvatarFallback>
                {owner.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{owner.name}</p>
              <p className="text-sm text-muted-foreground">{owner.email}</p>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">Owner</span>
        </div>

        {/* Permissions */}
        {permissions.map((p) => (
          <div key={p.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage
                  src={
                    'image' in p.subject ? p.subject.image || undefined : ''
                  }
                />
                <AvatarFallback>
                  {p.subject.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{p.subject.name}</p>
                {'email' in p.subject && (
                  <p className="text-sm text-muted-foreground">
                    {p.subject.email}
                  </p>
                )}
              </div>
            </div>
            <Select
              defaultValue={p.action}
              onValueChange={(value) =>
                handlePermissionChange(p.id, value as PermissionAction)
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEW">Viewer</SelectItem>
                <SelectItem value="EDIT">Editor</SelectItem>
                <SelectItem value="SHARE">Full Access</SelectItem>
                <SelectItem value="REMOVE">Remove</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
