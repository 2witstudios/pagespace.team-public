"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/main-header";
import Sidebar from "@/components/layout/left-sidebar";
import CenterPanel from "@/components/layout/middle-content";
import RightPanel from "@/components/layout/right-sidebar";

export default function Dashboard() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        onToggleLeftPanel={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
      />
      <div className="flex flex-grow overflow-hidden">
        {isLeftPanelOpen && <Sidebar />}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <CenterPanel />
        </main>
        {isRightPanelOpen && <RightPanel />}
      </div>
    </div>
  );
}