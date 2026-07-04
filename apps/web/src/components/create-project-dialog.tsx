"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import { useWorkspace } from "@/providers/workspace-provider";
import { toast } from "sonner";

interface CreateProjectDialogProps {
  children?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "create" | "edit";
  project?: any;
}

export function CreateProjectDialog({ children, open: controlledOpen, onOpenChange: setControlledOpen, mode = "create", project }: CreateProjectDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = setControlledOpen || setLocalOpen;
  
  const [name, setName] = useState("");
  const { activeOrgId } = useWorkspace();

  useEffect(() => {
    if (open && mode === "edit" && project) {
      setName(project.name);
    } else if (open && mode === "create") {
      setName("");
    }
  }, [open, mode, project]);

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !activeOrgId) return;
    
    if (mode === "create") {
      createMutation.mutate({ name }, {
        onSuccess: () => {
          toast.success("Project created successfully");
          setOpen(false);
          setName("");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to create project");
        }
      });
    } else if (mode === "edit" && project) {
      updateMutation.mutate({ id: project.id, name }, {
        onSuccess: () => {
          toast.success("Project updated successfully");
          setOpen(false);
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update project");
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger render={children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Project" : "Edit Project"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new project to group related workflows and jobs."
              : "Update your project details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Email Service" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name}>
              {isPending ? "Saving..." : mode === "create" ? "Create Project" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
