'use client';

import { useState } from 'react';
import { usePageStore } from '@/hooks/usePage';
import { usePageTree } from '@/hooks/usePageTree';
import { findNodeAndParent } from '@/lib/tree-utils';
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowUpLeftFromSquare, Users, UserCog } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PermissionsList } from './PermissionsList';
import { toast } from 'sonner';
import { PermissionAction, SubjectType } from '@pagespace/lib/client';

export function ShareDialog() {
  const pageId = usePageStore((state) => state.pageId);
  const params = useParams();
  const driveSlug = params.driveSlug as string;
  const { tree } = usePageTree(driveSlug);
  const pageResult = pageId ? findNodeAndParent(tree, pageId) : null;
  const page = pageResult?.node;
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add a key to force re-render of PermissionsList
  const [permissionsVersion, setPermissionsVersion] = useState(0);

  if (!page) return null;

  const handleInvite = async () => {
    if (!email) {
      toast.error('Please enter an email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Find the user by email
      const userResponse = await fetch(`/api/users/find?email=${encodeURIComponent(email)}`);
      if (!userResponse.ok) {
        const { error } = await userResponse.json();
        throw new Error(error || 'User not found.');
      }
      const user = await userResponse.json();

      // 2. Create the permission
      const permissionResponse = await fetch(`/api/pages/${page.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: user.id,
          subjectType: SubjectType.USER,
          action: PermissionAction.VIEW, // Default to VIEW permission
        }),
      });

      if (!permissionResponse.ok) {
        const { error } = await permissionResponse.json();
        throw new Error(error || 'Failed to grant permission.');
      }

      toast.success(`Invite sent to ${email}`);
      setEmail('');
      // Increment version to trigger re-render of PermissionsList
      setPermissionsVersion(v => v + 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <ArrowUpLeftFromSquare className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{page.title}&rdquo;</DialogTitle>
          <DialogDescription>
            Manage who has access to this page.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="share" className="mt-4">
          <TabsList>
            <TabsTrigger value="share">
              <Users className="mr-2 h-4 w-4" />
              Share
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <UserCog className="mr-2 h-4 w-4" />
              Permissions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="share" className="mt-4">
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="Add people by email..."
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <Button onClick={handleInvite} disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="permissions" className="mt-4">
            <PermissionsList key={permissionsVersion} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}