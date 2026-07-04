"use client";

import * as React from "react";
import { Command, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  DASHBOARD_NAV_ITEMS,
  ORCHESTRATION_NAV_ITEMS,
  SYSTEM_NAV_ITEMS,
} from "@/constants/navigation";

import { useWorkspace } from "@/providers/workspace-provider";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const { organizations, activeOrg, activeOrgId, setActiveOrgId, isLoadingOrgs } = useWorkspace();
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-border/50 bg-background transition-all duration-300 ease-in-out">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200"
                />
              }>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">
                    {isLoadingOrgs ? "Loading..." : (activeOrg?.name || "No Organization")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">Enterprise</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Workspaces
                  </DropdownMenuLabel>
                  {organizations.map((org) => (
                    <DropdownMenuItem 
                      key={org.id}
                      onClick={() => setActiveOrgId(org.id)} 
                      className="gap-2 p-2 cursor-pointer"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Command className="size-3" />
                      </div>
                      {org.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="gap-2 p-2 cursor-pointer text-muted-foreground" 
                    onSelect={(e) => { e.preventDefault(); setCreateOrgOpen(true); }}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md bg-background border">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-foreground">Add workspace</div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DASHBOARD_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />} isActive={pathname === item.url} tooltip={item.title}>
                    <item.icon className="text-muted-foreground" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Orchestration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ORCHESTRATION_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />} isActive={pathname === item.url} tooltip={item.title}>
                    <item.icon className="text-muted-foreground" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SYSTEM_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />} isActive={pathname === item.url} tooltip={item.title}>
                    <item.icon className="text-muted-foreground" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
