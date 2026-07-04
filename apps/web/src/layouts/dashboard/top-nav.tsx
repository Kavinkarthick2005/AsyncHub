"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { Bell, Search, Activity, Server, Clock, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon, Building2, Briefcase } from "lucide-react";
import { useWorkspace } from "@/providers/workspace-provider";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

export function TopNav() {
  const { activeOrgId, activeOrg, isLoadingOrgs } = useWorkspace();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const router = useRouter();

  React.useEffect(() => {
    if (!activeOrgId) return;

    const token = localStorage.getItem("asynchub_token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL?.replace("http://", "")?.replace("https://", "") || "localhost:8000";
    const wsUrl = `${protocol}//${host}/api/v1/ws/orgs/${activeOrgId}?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connection.established" || data.type === "pong") return;
      
      // Treat failures as notifications
      if (data.type === "job.status_changed" && data.payload?.to_status === "failed") {
        setNotifications((prev) => [{...data, id: Date.now()}, ...prev].slice(0, 10));
        setUnreadCount((c) => c + 1);
      }
    };

    return () => ws.close();
  }, [activeOrgId]);

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
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors outline-none">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
          } />
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={() => setUnreadCount(0)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex flex-col items-start p-3 gap-1 cursor-default focus:bg-transparent">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="font-semibold text-sm">Job Failed</span>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      Job {n.payload?.job_id} encountered an error.
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Organization</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Workspace</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
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
