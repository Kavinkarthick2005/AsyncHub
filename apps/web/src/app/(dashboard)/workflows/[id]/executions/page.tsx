"use client";

import { useQuery } from "@tanstack/react-query";
import { workflowsApi } from "@/lib/api/workflows";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function ExecutionsPage(props: { params: Promise<{ id: string }> }) {
  const params = useParams();
  const workflowId = params.id as string;
  const router = useRouter();

  const { data: workflow } = useQuery({
    queryKey: ["workflows", workflowId],
    queryFn: () => workflowsApi.get(workflowId),
  });

  const { data: executions, isLoading, refetch } = useQuery({
    queryKey: ["workflow-executions", workflowId],
    queryFn: () => workflowsApi.getExecutions(workflowId),
    refetchInterval: 5000, // Poll every 5s while looking at executions
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (state: any) => {
    if (!state) return "0 / 0";
    const completed = state.completed?.length || 0;
    const running = state.running?.length || 0;
    const waiting = state.waiting?.length || 0;
    const failed = state.failed?.length || 0;
    const total = completed + running + waiting + failed;
    return `${completed} / ${total} nodes completed`;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/workflows" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Executions</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button render={<Link href={`/workflows/${workflowId}/builder`} />}>
            <Play className="mr-2 h-4 w-4" /> Open Builder
          </Button>
        </div>
      </div>

      <div className="text-muted-foreground">
        Workflow: {workflow?.name}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>Recent runs for this workflow.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading executions...</div>
          ) : executions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No executions yet. Open the builder to trigger a run.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions?.map((execution: any) => {
                  const start = new Date(execution.started_at);
                  const end = execution.completed_at ? new Date(execution.completed_at) : new Date();
                  const durationMs = end.getTime() - start.getTime();
                  const durationStr = (durationMs / 1000).toFixed(1) + "s";
                  
                  return (
                    <TableRow key={execution.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/workflows/${workflowId}/executions/${execution.id}`)}>
                      <TableCell>{getStatusBadge(execution.status)}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {calculateProgress(execution.current_state)}
                      </TableCell>
                      <TableCell>{formatDistanceToNow(start, { addSuffix: true })}</TableCell>
                      <TableCell>{execution.completed_at ? formatDistanceToNow(new Date(execution.completed_at), { addSuffix: true }) : '-'}</TableCell>
                      <TableCell>{durationStr}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
