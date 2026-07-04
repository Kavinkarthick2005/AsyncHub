"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { EmptyState } from "@/components/empty-state";
import { FolderOpen } from "lucide-react";
import { useStaggerFadeIn } from "@/animations";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { Edit2 } from "lucide-react";
import { useState } from "react";

export default function ProjectsPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);
  const { activeOrgId } = useWorkspace();
  const [editingProject, setEditingProject] = useState<any>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", activeOrgId],
    queryFn: () => fetchApi(`/organizations/${activeOrgId}/projects`),
    enabled: !!activeOrgId,
  });

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">Manage your orchestration projects.</p>
        </div>
        <CreateProjectDialog>
          <Button disabled={!activeOrgId}>Create Project</Button>
        </CreateProjectDialog>
      </div>

      {!activeOrgId ? (
        <EmptyState 
          icon={FolderOpen}
          title="No Organization Selected"
          description="Please select or create an organization first."
        />
      ) : isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(i => <div key={i} className="h-24 w-full bg-muted rounded-xl"></div>)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState 
          icon={FolderOpen}
          title="No Projects"
          description="This organization has no projects yet. Create one to get started."
          actionNode={
            <CreateProjectDialog>
              <Button variant="outline">Create Project</Button>
            </CreateProjectDialog>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <Card key={project.id} className="transition-all hover:border-primary/50 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {project.name}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProject(project)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="font-mono text-xs mt-2">{project.id}</CardDescription>
              </CardHeader>
            </Card>
          ))}
          <CreateProjectDialog 
            open={!!editingProject} 
            onOpenChange={(open) => { if (!open) setEditingProject(null); }} 
            mode="edit" 
            project={editingProject} 
          />
        </div>
      )}
    </div>
  );
}
