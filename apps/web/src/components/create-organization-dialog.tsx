"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useWorkspace } from "@/providers/workspace-provider";

interface CreateOrganizationDialogProps {
  children: React.ReactElement;
}

export function CreateOrganizationDialog({ children }: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const { setActiveOrgId } = useWorkspace();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      return fetchApi("/organizations/", {
        method: "POST",
        body: JSON.stringify({ name, slug }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userOrgs"] });
      setActiveOrgId(data.id);
      setOpen(false);
      setName("");
      setSlug("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new workspace to orchestrate your jobs and manage your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input 
              id="name" 
              placeholder="Acme Corp" 
              value={name} 
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
              }}
              required 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input 
              id="slug" 
              placeholder="acme-corp" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)}
              required 
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={createMutation.isPending || !name || !slug}>
              {createMutation.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
