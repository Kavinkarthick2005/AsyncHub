"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Activity, Server, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useFadeIn } from "@/animations";
import { useParams } from "next/navigation";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const containerRef = useFadeIn(0.1);

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchApi(`/jobs/${jobId}`),
    enabled: !!jobId,
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 w-full bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load job details</h2>
        <Button variant="outline" asChild>
          <Link href="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const events = job.events || [];

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {job.name} {getStatusBadge(job.status)}
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">{job.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(job.payload, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execution Timeline</CardTitle>
              <CardDescription>Event history for this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {events.length === 0 ? (
                  <p className="text-center text-muted-foreground">No events recorded.</p>
                ) : (
                  events.map((event: any, index: number) => (
                    <div key={event.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {event.to_status === 'completed' ? <Activity className="h-4 w-4 text-primary" /> :
                         event.to_status === 'failed' ? <AlertCircle className="h-4 w-4 text-destructive" /> :
                         <Clock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-foreground">
                            Status changed to <span className="capitalize">{event.to_status}</span>
                          </div>
                          <time className="font-mono text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </time>
                        </div>
                        {event.message && (
                          <div className="text-muted-foreground text-sm mt-2">
                            {event.message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium">{job.priority}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Retries</span>
                <span className="font-medium">{job.retries} / {job.max_retries}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Queue</span>
                <span className="font-medium">{job.queue_id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
