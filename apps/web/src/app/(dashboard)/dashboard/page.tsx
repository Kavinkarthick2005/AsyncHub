"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useStaggerFadeIn } from "@/animations";
import { useWorkspace } from "@/providers/workspace-provider";

import { SystemHealthWidget } from "@/components/dashboard/system-health";
import { OverviewWidget } from "@/components/dashboard/overview-widget";
import { WorkersWidget } from "@/components/dashboard/workers-widget";
import { SchedulesWidget } from "@/components/dashboard/schedules-widget";
import { QueuesWidget } from "@/components/dashboard/queues-widget";
import { RealtimeFeedWidget } from "@/components/dashboard/realtime-feed-widget";
import { SlowestJobsWidget } from "@/components/dashboard/slowest-jobs-widget";
import { RetryHeatmapWidget } from "@/components/dashboard/retry-heatmap-widget";
import { RecentFailuresWidget } from "@/components/dashboard/recent-failures-widget";

export default function DashboardPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);
  const { activeOrgId } = useWorkspace();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", activeOrgId],
    queryFn: () => fetchApi(`/dashboard/overview?organization_id=${activeOrgId}`),
    enabled: !!activeOrgId,
    refetchInterval: 15000, // Refresh every 15s for "live" feel
  });

  if (!activeOrgId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Organization Selected</h2>
          <p className="text-muted-foreground">Please create or select an organization to view stats.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load dashboard stats</h2>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const stats = data || {};

  return (
    <div className="flex flex-col gap-6 pb-12" ref={containerRef}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Operations Control Plane</h1>
        <p className="text-muted-foreground mt-2">Monitor cluster health, queues, and workers in real-time.</p>
      </div>

      {/* Row 1: High-Level Widgets */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SystemHealthWidget health={stats.system_health} />
        <OverviewWidget overview={stats.overview} />
        <WorkersWidget workers={stats.workers} />
        <SchedulesWidget schedules={stats.schedules} />
      </div>

      {/* Row 2: Feeds & Queues */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <QueuesWidget queues={stats.queues} />
        </div>
        <div>
          <RealtimeFeedWidget organizationId={activeOrgId} />
        </div>
      </div>

      {/* Row 3: Problems & Bottlenecks */}
      <div className="grid gap-4 md:grid-cols-3">
        <RecentFailuresWidget failures={stats.recent_failures} />
        <SlowestJobsWidget jobs={stats.slowest_jobs} />
        <RetryHeatmapWidget heatmap={stats.retry_heatmap} />
      </div>
    </div>
  );
}
