"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { EmptyState } from "@/components/empty-state";
import { Server } from "lucide-react";
import { useStaggerFadeIn } from "@/animations";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WorkersPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);
  const { activeOrgId } = useWorkspace();
  const workers: any[] = []; // Currently no backend endpoint for workers list, placeholder

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
          <p className="text-muted-foreground mt-2">Manage your distributed worker nodes.</p>
        </div>
        <Button disabled={!activeOrgId}>Provision Worker</Button>
      </div>

      {!activeOrgId ? (
        <EmptyState 
          icon={Server}
          title="No Organization Selected"
          description="Please select or create an organization first."
        />
      ) : workers.length === 0 ? (
        <EmptyState 
          icon={Server}
          title="No Workers Found"
          description="You don't have any workers connected to this organization."
          actionLabel="View Setup Guide"
          onAction={() => alert("Setup guide coming soon")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker: any) => (
            <Card key={worker.id} className="transition-all hover:border-primary/50">
              <CardHeader>
                <CardTitle>{worker.name}</CardTitle>
                <CardDescription className="font-mono text-xs mt-2">{worker.id}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
