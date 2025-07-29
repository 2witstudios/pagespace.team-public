"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/main-header";
import Sidebar from "@/components/layout/left-sidebar";
import RightPanel from "@/components/layout/right-sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const isMobile = useMobile();
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(!isMobile);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(!isMobile);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    setIsLeftPanelOpen(!isMobile);
    setIsRightPanelOpen(!isMobile);
  }, [isMobile]);

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        onToggleLeftPanel={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
      />
      <div className="flex flex-grow overflow-hidden relative">
        {/* Desktop Left Sidebar */}
        <div className={cn("hidden", { "md:flex": isLeftPanelOpen })}>
            <Sidebar />
        </div>

        {/* Mobile Left Sidebar */}
        {isMobile && isLeftPanelOpen && (
            <div className="absolute top-0 left-0 h-full z-40">
                <Sidebar />
            </div>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto bg-background">
          {children}
        </main>

        {/* Desktop Right Sidebar */}
        <div className={cn("hidden", { "md:flex": isRightPanelOpen })}>
            <RightPanel />
        </div>

        {/* Mobile Right Sidebar */}
        {isMobile && isRightPanelOpen && (
            <div className="absolute top-0 right-0 h-full z-40">
                <RightPanel />
            </div>
        )}

        {/* Mobile Overlay */}
        {isMobile && (isLeftPanelOpen || isRightPanelOpen) && (
            <div 
                className="absolute inset-0 bg-black/30 z-30"
                onClick={() => {
                    setIsLeftPanelOpen(false);
                    setIsRightPanelOpen(false);
                }}
            />
        )}
      </div>
    </div>
  );
}