"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useWorkspace } from "@/providers/workspace-provider";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

export function TopNav() {
  const { activeOrg, isLoadingOrgs } = useWorkspace();

  const { data: user } = useQuery({
    queryKey: ["userMe"],
    queryFn: () => fetchApi("/auth/me")
  });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">
                {isLoadingOrgs ? "..." : (activeOrg?.name || "No Organization")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-4">
        <div 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="relative hidden md:flex h-8 w-64 items-center rounded-md border border-border/50 bg-muted/50 px-3 text-sm text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search resources...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-primary" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<button className="outline-none focus:outline-none" />}>
            <Avatar className="h-8 w-8 rounded-lg cursor-pointer ring-1 ring-border">
              <AvatarImage src="" alt={user?.full_name || "User"} />
              <AvatarFallback className="rounded-lg bg-primary/20 text-primary text-xs font-medium">
                {getInitials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              // Client-side only logout, no server-side token revocation (v1 limitation)
              localStorage.removeItem("token");
              localStorage.removeItem("orgId");
              localStorage.removeItem("projectId");
              window.location.href = "/login";
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
