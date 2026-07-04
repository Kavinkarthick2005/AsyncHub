"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useQueueSocket } from "@/hooks/useQueueSocket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Eye } from "lucide-react";
import { useStaggerFadeIn } from "@/animations";
import Link from "next/link";

const PROJECT_ID = typeof window !== "undefined" ? localStorage.getItem("projectId") : null;
const TOKEN = typeof window !== "undefined" ? localStorage.getItem("token") : null;

export default function JobsPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch queues for the dropdown
  const { data: queues, isLoading: isLoadingQueues } = useQuery({
    queryKey: ["queues", PROJECT_ID],
    queryFn: () => fetchApi(`/projects/${PROJECT_ID}/queues`),
    enabled: !!PROJECT_ID,
  });

  // Automatically select the first queue if none is selected
  if (queues?.length > 0 && !selectedQueue) {
    setSelectedQueue(queues[0].id);
  }

  // Fetch jobs for the selected queue
  const { data: jobsData, isLoading: isLoadingJobs, isError, refetch } = useQuery({
    queryKey: ["jobs", selectedQueue, statusFilter],
    queryFn: () => {
      let url = `/queues/${selectedQueue}/jobs`;
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      return fetchApi(url);
    },
    enabled: !!selectedQueue,
  });

  // Hook up WebSocket for live updates
  useQueueSocket({
    queueId: selectedQueue || "",
    token: TOKEN,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "queued": return <Badge variant="queued">Queued</Badge>;
      case "running": return <Badge variant="running">Running</Badge>;
      case "completed": return <Badge variant="completed">Completed</Badge>;
      case "failed": return <Badge variant="failed">Failed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (!PROJECT_ID) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Project Selected</h2>
          <p className="text-muted-foreground">Please create or select a project to view jobs.</p>
        </div>
      </div>
    );
  }

  const jobs = jobsData || [];

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Explorer</h1>
        <p className="text-muted-foreground mt-2">View and manage individual job executions.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>
              {jobs.length} jobs found
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
              value={selectedQueue || ""}
              onChange={(e) => setSelectedQueue(e.target.value)}
              disabled={isLoadingQueues}
            >
              <option value="" disabled>Select Queue</option>
              {queues?.map((q: any) => (
                <option key={q.id} value={q.id} className="bg-background text-foreground">{q.name}</option>
              ))}
            </select>

            <select
              className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="" className="bg-background text-foreground">All Statuses</option>
              <option value="queued" className="bg-background text-foreground">Queued</option>
              <option value="running" className="bg-background text-foreground">Running</option>
              <option value="completed" className="bg-background text-foreground">Completed</option>
              <option value="failed" className="bg-background text-foreground">Failed</option>
            </select>
            
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoadingJobs}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="p-8 text-center text-destructive">
              Error loading jobs. Please try again.
            </div>
          ) : isLoadingJobs ? (
            <div className="space-y-4 animate-pulse">
               {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 w-full bg-muted rounded"></div>
               ))}
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <div className="grid grid-cols-5 border-b border-border p-4 text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Job ID / Name</div>
                <div>Status</div>
                <div>Created At</div>
                <div className="text-right">Actions</div>
              </div>
              
              {!jobs?.length ? (
                <div className="p-8 text-center text-muted-foreground">
                  No jobs found matching criteria
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {jobs.map((job: any) => (
                    <div key={job.id} className="grid grid-cols-5 items-center p-4 transition-colors hover:bg-muted/50">
                      <div className="col-span-2 flex flex-col">
                        <span className="font-medium truncate pr-4">{job.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{job.id.substring(0, 13)}...</span>
                      </div>
                      <div>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleString()}
                      </div>
                      <div className="text-right">
                        <Button variant="ghost" size="sm" render={<Link href={`/jobs/${job.id}`} />}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
