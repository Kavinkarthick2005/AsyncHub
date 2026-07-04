import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useWorkspace } from "@/providers/workspace-provider";

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { activeOrgId } = useWorkspace();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      return fetchApi(`/organizations/${activeOrgId}/projects`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData<any[]>(["projects", activeOrgId], (old) => {
        return old ? [...old, data] : [data];
      });
      queryClient.invalidateQueries({ queryKey: ["projects", activeOrgId] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { activeOrgId } = useWorkspace();

  return useMutation({
    mutationFn: async (params: { id: string; name: string }) => {
      return fetchApi(`/organizations/${activeOrgId}/projects/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: params.name }),
      });
    },
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ["projects", activeOrgId] });
      const previousProjects = queryClient.getQueryData<any[]>(["projects", activeOrgId]);

      queryClient.setQueryData<any[]>(["projects", activeOrgId], (old) => {
        if (!old) return [];
        return old.map(project => project.id === newProject.id ? { ...project, name: newProject.name, updated_at: new Date().toISOString() } : project);
      });

      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects", activeOrgId], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", activeOrgId] });
    },
  });
}
