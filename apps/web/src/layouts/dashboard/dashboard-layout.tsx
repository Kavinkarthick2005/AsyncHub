"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { TopNav } from "./top-nav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { CommandPalette } from "@/components/command-palette";

import { WorkspaceProvider } from "@/providers/workspace-provider";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopNav />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6 bg-background">
            {children}
          </main>
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
