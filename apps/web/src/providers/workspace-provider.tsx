"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceContextType {
  activeOrgId: string | null;
  setActiveOrgId: (id: string) => void;
  organizations: Organization[];
  isLoadingOrgs: boolean;
  activeOrg: Organization | null;
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeOrgId, setActiveOrgIdState] = React.useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  // Fetch the current user's organizations
  const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery<Organization[]>({
    queryKey: ["organizations"],
    queryFn: () => fetchApi("/organizations/"),
  });

  // On mount and when organizations data is loaded, validate the activeOrgId
  React.useEffect(() => {
    if (isLoadingOrgs || hasInitialized) return;

    const cachedOrgId = localStorage.getItem("orgId");
    
    if (organizations.length > 0) {
      // Validate cached org against fetched orgs
      const isValid = organizations.some(org => org.id === cachedOrgId);
      
      if (isValid && cachedOrgId) {
        setActiveOrgIdState(cachedOrgId);
      } else {
        // Cached org is invalid or missing, fallback to first available
        const fallbackOrgId = organizations[0].id;
        setActiveOrgIdState(fallbackOrgId);
        localStorage.setItem("orgId", fallbackOrgId);
      }
    } else {
      // User has no organizations at all
      if (cachedOrgId) {
        localStorage.removeItem("orgId");
      }
      setActiveOrgIdState(null);
    }
    
    setHasInitialized(true);
  }, [organizations, isLoadingOrgs, hasInitialized]);

  const setActiveOrgId = React.useCallback((id: string) => {
    setActiveOrgIdState(id);
    localStorage.setItem("orgId", id);
    // Optionally trigger a router refresh to ensure full page data consistency if not using pure React Query
    // router.refresh();
  }, []);

  const activeOrg = organizations.find((org) => org.id === activeOrgId) || null;

  return (
    <WorkspaceContext.Provider
      value={{
        activeOrgId,
        setActiveOrgId,
        organizations,
        isLoadingOrgs,
        activeOrg,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
