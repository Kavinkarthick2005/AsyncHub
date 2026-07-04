"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { workflowsApi } from "@/lib/api/workflows";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, AlertCircle, RefreshCcw, Network } from "lucide-react";
import { useStaggerFadeIn } from "@/animations";
import { useWorkspace } from "@/providers/workspace-provider";
import { useRouter } from "next/navigation";

export default function WorkflowsPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { activeOrgId } = useWorkspace();

  // Fetch projects for the active organization
  const { data: projects } = useQuery({
    queryKey: ["projects", activeOrgId],
    queryFn: () => fetchApi(`/organizations/${activeOrgId}/projects`),
    enabled: !!activeOrgId,
  });

  const projectId = projects?.[0]?.id || null;

  const { data: workflows, isLoading, isError, refetch } = useQuery({
    queryKey: ["workflows", projectId],
    queryFn: () => workflowsApi.list(projectId!),
    enabled: !!projectId,
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (name: string) => {
      return workflowsApi.create(projectId!, {
        name,
        description: "",
        status: "draft",
        is_active: true,
      });
    },
    onSuccess: (newWorkflow) => {
      queryClient.invalidateQueries({ queryKey: ["workflows", projectId] });
      router.push(`/workflows/${newWorkflow.id}/builder`);
    }
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => workflowsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", projectId] });
    }
  });

  const handleCreate = () => {
    createWorkflowMutation.mutate("Untitled Workflow");
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Project Selected</h2>
          <p className="text-muted-foreground">Please create or select a project to view workflows.</p>
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
        <h2 className="text-xl font-semibold">Failed to load workflows</h2>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-2">Design and orchestrate dependent job pipelines (DAGs).</p>
        </div>
        <Button onClick={handleCreate} disabled={createWorkflowMutation.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workflows</CardTitle>
          <CardDescription>
            {workflows?.length || 0} workflows in current project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <div className="grid grid-cols-6 border-b border-border p-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Name</div>
              <div>Status</div>
              <div>Version</div>
              <div className="text-right">Actions</div>
            </div>
            
            {!workflows?.length ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Network className="h-12 w-12 text-muted-foreground/30 mb-4" />
                No workflows found. Create one to get started!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {workflows.map((workflow: any) => (
                  <div key={workflow.id} className="grid grid-cols-6 items-center p-4 hover:bg-muted/30 transition-colors">
                    <div className="col-span-3 font-medium">
                      {workflow.name}
                    </div>
                    <div>
                      {workflow.status === 'valid' ? (
                        <Badge variant="success">Valid</Badge>
                      ) : workflow.status === 'invalid' ? (
                        <Badge variant="destructive">Invalid</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      v{workflow.definition_version}
                    </div>
                    <div className="text-right flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/workflows/${workflow.id}/builder`)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" /> Edit DAG
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this workflow?')) {
                            deleteWorkflowMutation.mutate(workflow.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
