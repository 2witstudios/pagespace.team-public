"use client";

import { usePageTree } from "@/hooks/usePageTree";
import PageTree from "@/components/layout/left-sidebar/page-tree/PageTree";
import { useParams } from "next/navigation";

export default function TrashPage() {
  const params = useParams();
  const driveSlug = params.driveSlug as string;
  const { tree, isLoading, isError, mutate } = usePageTree(driveSlug, true);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Failed to load trash.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Trash</h1>
      <PageTree driveSlug={driveSlug} initialTree={tree} mutate={mutate} isTrashView={true} />
    </div>
  );
}