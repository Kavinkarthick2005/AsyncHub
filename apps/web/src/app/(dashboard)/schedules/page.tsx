"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Plus, Trash, Pause, Play } from "lucide-react";
import { useStaggerFadeIn } from "@/animations";
import { useWorkspace } from "@/providers/workspace-provider";
import { CreateScheduleDialog } from "@/components/create-schedule-dialog";

export default function SchedulesPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { activeOrgId } = useWorkspace();

  const { data: projects } = useQuery({
    queryKey: ["projects", activeOrgId],
    queryFn: () => fetchApi(`/organizations/${activeOrgId}/projects`),
    enabled: !!activeOrgId,
  });

  const projectId = projects?.[0]?.id || null;

  const { data: queues, isLoading: isLoadingQueues } = useQuery({
    queryKey: ["queues", projectId],
    queryFn: () => fetchApi(`/projects/${projectId}/queues`),
    enabled: !!projectId,
  });

  if (queues?.length > 0 && !selectedQueue) {
    setSelectedQueue(queues[0].id);
  }

  const { data: schedules, isLoading: isLoadingSchedules, refetch } = useQuery({
    queryKey: ["schedules", selectedQueue],
    queryFn: () => fetchApi(`/schedules/?queue_id=${selectedQueue}`),
    enabled: !!selectedQueue,
  });

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await fetchApi(`/schedules/${scheduleId}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["schedules", selectedQueue] });
    } catch (err) {
      alert("Failed to delete schedule");
    }
  };

  const handleTogglePause = async (schedule: any) => {
    try {
      await fetchApi(`/schedules/${schedule.id}`, { 
        method: "PATCH",
        body: JSON.stringify({ is_active: !schedule.is_active })
      });
      queryClient.invalidateQueries({ queryKey: ["schedules", selectedQueue] });
    } catch (err) {
      alert("Failed to update schedule status");
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Project Selected</h2>
          <p className="text-muted-foreground">Please create or select a project to view schedules.</p>
        </div>
      </div>
    );
  }

  const scheds = schedules || [];

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
          <p className="text-muted-foreground mt-2">Manage recurring jobs and chron tasks.</p>
        </div>
        {selectedQueue && (
          <CreateScheduleDialog 
            queueId={selectedQueue} 
            trigger={<Button><Plus className="mr-2 h-4 w-4" /> New Schedule</Button>} 
          />
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Configured Schedules</CardTitle>
            <CardDescription>
              {scheds.length} schedules found
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              className="flex h-9 w-[200px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedQueue || ""}
              onChange={(e) => setSelectedQueue(e.target.value)}
              disabled={isLoadingQueues}
            >
              <option value="" disabled>Select Queue</option>
              {queues?.map((q: any) => (
                <option key={q.id} value={q.id} className="bg-background text-foreground">{q.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSchedules ? (
            <div className="space-y-4 animate-pulse">
               {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 w-full bg-muted rounded"></div>
               ))}
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <div className="grid grid-cols-6 border-b border-border p-4 text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Name & Cron</div>
                <div>Status</div>
                <div>Last Run</div>
                <div>Next Run</div>
                <div className="text-right">Actions</div>
              </div>
              
              {!scheds.length ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <Clock className="h-10 w-10 mb-4 opacity-20" />
                  No schedules configured for this queue.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {scheds.map((schedule: any) => (
                    <div key={schedule.id} className="grid grid-cols-6 items-center p-4 transition-colors hover:bg-muted/50">
                      <div className="col-span-2 flex flex-col">
                        <span className="font-medium truncate pr-4">{schedule.name}</span>
                        <span className="text-xs text-muted-foreground font-mono mt-1">{schedule.cron_expression}</span>
                      </div>
                      <div>
                        {schedule.is_active ? 
                          <Badge variant="completed" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Enabled</Badge> : 
                          <Badge variant="outline" className="text-muted-foreground">Paused</Badge>
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.last_run_at ? new Date(schedule.last_run_at).toLocaleString() : "Never"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.next_run_at ? new Date(schedule.next_run_at).toLocaleString() : "Pending"}
                      </div>
                      <div className="text-right flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleTogglePause(schedule)} title={schedule.is_active ? "Pause Schedule" : "Resume Schedule"}>
                          {schedule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)} title="Delete Schedule">
                          <Trash className="h-4 w-4 text-destructive" />
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
