"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pause, Play, AlertCircle, RefreshCcw } from "lucide-react";
import { useStaggerFadeIn } from "@/animations";

const PROJECT_ID = typeof window !== "undefined" ? localStorage.getItem("projectId") : null;

export default function QueuesPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);
  const queryClient = useQueryClient();

  const { data: queues, isLoading, isError, refetch } = useQuery({
    queryKey: ["queues", PROJECT_ID],
    queryFn: () => fetchApi(`/projects/${PROJECT_ID}/queues`),
    enabled: !!PROJECT_ID,
  });

  const togglePauseMutation = useMutation({
    mutationFn: async ({ queueId, is_paused }: { queueId: string; is_paused: boolean }) => {
      return fetchApi(`/queues/${queueId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_paused }),
      });
    },
    onMutate: async ({ queueId, is_paused }) => {
      await queryClient.cancelQueries({ queryKey: ["queues", PROJECT_ID] });
      const previousQueues = queryClient.getQueryData(["queues", PROJECT_ID]);

      queryClient.setQueryData(["queues", PROJECT_ID], (old: any) => {
        if (!old) return old;
        return old.map((q: any) =>
          q.id === queueId ? { ...q, is_paused } : q
        );
      });

      return { previousQueues };
    },
    onError: (err, newQueue, context) => {
      if (context?.previousQueues) {
        queryClient.setQueryData(["queues", PROJECT_ID], context.previousQueues);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["queues", PROJECT_ID] });
    },
  });

  if (!PROJECT_ID) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Project Selected</h2>
          <p className="text-muted-foreground">Please create or select a project to view queues.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-4 w-64 bg-muted rounded mt-2"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 w-full bg-muted rounded"></div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load queues</h2>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queues</h1>
        <p className="text-muted-foreground mt-2">Manage job queues and control processing state.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Queues</CardTitle>
          <CardDescription>
            {queues?.length || 0} queues in current project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <div className="grid grid-cols-5 border-b border-border p-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-2">Name</div>
              <div>Status</div>
              <div>Concurrency</div>
              <div className="text-right">Actions</div>
            </div>
            
            {!queues?.length ? (
              <div className="p-8 text-center text-muted-foreground">
                No queues found
              </div>
            ) : (
              <div className="divide-y divide-border">
                {queues.map((queue: any) => (
                  <div key={queue.id} className="grid grid-cols-5 items-center p-4">
                    <div className="col-span-2 font-medium">
                      {queue.name}
                    </div>
                    <div>
                      {queue.is_paused ? (
                        <Badge variant="warning">Paused</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {queue.concurrency_limit} / sec
                    </div>
                    <div className="text-right flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePauseMutation.mutate({ queueId: queue.id, is_paused: !queue.is_paused })}
                        disabled={togglePauseMutation.isPending && togglePauseMutation.variables?.queueId === queue.id}
                      >
                        {queue.is_paused ? (
                          <>
                            <Play className="mr-2 h-4 w-4" /> Resume
                          </>
                        ) : (
                          <>
                            <Pause className="mr-2 h-4 w-4" /> Pause
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
