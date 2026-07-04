"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrganization, useUpdateOrganization } from "@/hooks/use-organizations";
import { Organization } from "@/providers/workspace-provider";
import { toast } from "sonner";

interface CreateOrganizationDialogProps {
  children?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "create" | "edit";
  organization?: Organization;
}

export function CreateOrganizationDialog({ children, open: controlledOpen, onOpenChange: setControlledOpen, mode = "create", organization }: CreateOrganizationDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = setControlledOpen || setLocalOpen;
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (open && mode === "edit" && organization) {
      setName(organization.name);
      setSlug(organization.slug);
    } else if (open && mode === "create") {
      setName("");
      setSlug("");
    }
  }, [open, mode, organization]);

  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    
    if (mode === "create") {
      createMutation.mutate({ name, slug }, {
        onSuccess: () => {
          toast.success("Organization created successfully");
          setOpen(false);
          setName("");
          setSlug("");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to create organization");
        }
      });
    } else if (mode === "edit" && organization) {
      updateMutation.mutate({ id: organization.id, name, slug }, {
        onSuccess: () => {
          toast.success("Organization updated successfully");
          setOpen(false);
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update organization");
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger render={children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Organization" : "Edit Organization"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new workspace to orchestrate your jobs and manage your team."
              : "Update your organization details and workspace slug."}
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
                if (mode === "create") {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                }
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name || !slug}>
              {isPending ? "Saving..." : mode === "create" ? "Create Organization" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
