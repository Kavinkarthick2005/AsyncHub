"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { TopNav } from "./top-nav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { CommandPalette } from "@/components/command-palette";

import { WorkspaceProvider, useWorkspace } from "@/providers/workspace-provider";

function MainContent({ children }: { children: React.ReactNode }) {
  const { activeOrgId } = useWorkspace();
  // Using activeOrgId as a key forces React to unmount and remount all page components,
  // completely destroying stale states like `selectedQueue` when the workspace changes.
  return (
    <main key={activeOrgId || 'empty'} className="flex flex-1 flex-col gap-4 p-4 lg:p-6 bg-background">
      {children}
    </main>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopNav />
          <MainContent>{children}</MainContent>
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
