"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useWorkspace } from "@/providers/workspace-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, MailWarning, RotateCcw } from "lucide-react";
import { useStaggerFadeIn } from "@/animations";
import { EmptyState } from "@/components/empty-state";

export default function DLQPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);
  const queryClient = useQueryClient();
  const { activeOrgId } = useWorkspace();

  // Fetch projects to get a projectId (since jobs are scoped to queues in projects)
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", activeOrgId],
    queryFn: () => fetchApi(`/organizations/${activeOrgId}/projects`),
    enabled: !!activeOrgId,
  });

  const projectId = projects[0]?.id;

  // Then fetch queues for this project
  const { data: queues = [] } = useQuery({
    queryKey: ["queues", projectId],
    queryFn: () => fetchApi(`/projects/${projectId}/queues`),
    enabled: !!projectId,
  });

  // For this v1, we will query dead jobs from the first queue in the active project
  const queueId = queues[0]?.id;

  const { data: jobs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["jobs", "dead", queueId],
    queryFn: () => fetchApi(`/queues/${queueId}/jobs?status=dead`),
    enabled: !!queueId,
  });

  const replayMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return fetchApi(`/jobs/${jobId}/replay`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "dead", queueId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", activeOrgId] });
    }
  });

  if (!activeOrgId) {
    return (
      <EmptyState 
        icon={MailWarning}
        title="No Organization Selected"
        description="Please select or create an organization first."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dead Letter Queue</h1>
          <p className="text-muted-foreground mt-2">Manage jobs that have exhausted all retries.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading || !queueId}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dead Jobs</CardTitle>
          <CardDescription>
            {jobs.length} permanently failed jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="p-8 text-center text-destructive">
              Error loading DLQ. Please try again.
            </div>
          ) : isLoading ? (
            <div className="space-y-4 animate-pulse">
               {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 w-full bg-muted rounded"></div>
               ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState 
              icon={MailWarning}
              title="DLQ is empty"
              description="Good news! There are no dead jobs in this queue."
            />
          ) : (
            <div className="rounded-md border border-border">
              <div className="grid grid-cols-4 border-b border-border p-4 text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Job Details</div>
                <div>Failed At</div>
                <div className="text-right">Actions</div>
              </div>
              
              <div className="divide-y divide-border">
                {jobs.map((job: any) => (
                  <div key={job.id} className="grid grid-cols-4 items-center p-4 transition-colors hover:bg-muted/50">
                    <div className="col-span-2 flex flex-col">
                      <span className="font-medium truncate pr-4">{job.name}</span>
                      <span className="text-xs text-destructive font-mono truncate pr-4 mt-1">
                        {job.error_message || "Unknown error"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(job.updated_at).toLocaleString()}
                    </div>
                    <div className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => replayMutation.mutate(job.id)}
                        disabled={replayMutation.isPending && replayMutation.variables === job.id}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> 
                        {replayMutation.isPending && replayMutation.variables === job.id ? "Replaying..." : "Replay"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
