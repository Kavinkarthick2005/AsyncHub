"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { EmptyState } from "@/components/empty-state";
import { Building2 } from "lucide-react";
import { useStaggerFadeIn } from "@/animations";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { Organization } from "@/types";

export default function OrganizationsPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);
  const { organizations, isLoadingOrgs } = useWorkspace();
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-2">Manage your workspaces and team access.</p>
        </div>
        <CreateOrganizationDialog>
          <Button>Create Organization</Button>
        </CreateOrganizationDialog>
      </div>

      {isLoadingOrgs ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(i => <div key={i} className="h-24 w-full bg-muted rounded-xl"></div>)}
        </div>
      ) : organizations.length === 0 ? (
        <EmptyState 
          icon={Building2}
          title="No Organizations"
          description="You don't belong to any organizations yet. Create one to get started."
          actionNode={
            <CreateOrganizationDialog>
              <Button variant="outline">Create Organization</Button>
            </CreateOrganizationDialog>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map(org => (
            <Card key={org.id} className="transition-all hover:border-primary/50 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {org.name}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingOrg(org)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="font-mono text-xs mt-2">{org.slug}</CardDescription>
              </CardHeader>
            </Card>
          ))}
          <CreateOrganizationDialog 
            open={!!editingOrg} 
            onOpenChange={(open) => { if (!open) setEditingOrg(null); }} 
            mode="edit" 
            organization={editingOrg || undefined} 
          />
        </div>
      )}
    </div>
  );
}
