import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useWorkspace } from "@/providers/workspace-provider";
import { Organization } from "@/providers/workspace-provider";

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { setActiveOrgId } = useWorkspace();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      return fetchApi("/organizations/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Organization[]>(["organizations"], (old) => {
        return old ? [...old, data] : [data];
      });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setActiveOrgId(data.id);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; name: string; slug: string }) => {
      return fetchApi(`/organizations/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: params.name, slug: params.slug }),
      });
    },
    onMutate: async (newOrg) => {
      await queryClient.cancelQueries({ queryKey: ["organizations"] });
      const previousOrgs = queryClient.getQueryData<Organization[]>(["organizations"]);

      queryClient.setQueryData<Organization[]>(["organizations"], (old) => {
        if (!old) return [];
        return old.map(org => org.id === newOrg.id ? { ...org, name: newOrg.name, slug: newOrg.slug, updated_at: new Date().toISOString() } : org);
      });

      return { previousOrgs };
    },
    onError: (err, newOrg, context) => {
      if (context?.previousOrgs) {
        queryClient.setQueryData(["organizations"], context.previousOrgs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}
