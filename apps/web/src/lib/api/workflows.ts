import { fetchApi } from '../api-client';

const api = {
  get: async (url: string) => {
    const data = await fetchApi(url);
    return { data };
  },
  post: async (url: string, body?: any) => {
    const data = await fetchApi(url, {
      method: 'POST',
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { data };
  },
  put: async (url: string, body?: any) => {
    const data = await fetchApi(url, {
      method: 'PUT',
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { data };
  },
  delete: async (url: string) => {
    const data = await fetchApi(url, { method: 'DELETE' });
    return { data };
  }
};

export interface Workflow {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'valid' | 'invalid';
  is_active: boolean;
  definition_version: number;
  definition: any; // { nodes: any[], edges: any[] }
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  status?: 'draft' | 'valid' | 'invalid';
  is_active?: boolean;
  definition_version?: number;
  definition?: any;
}

export interface WorkflowUpdate {
  name?: string;
  description?: string;
  status?: 'draft' | 'valid' | 'invalid';
  is_active?: boolean;
  definition_version?: number;
  definition?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const workflowsApi = {
  list: async (projectId: string): Promise<Workflow[]> => {
    const response = await api.get(`/projects/${projectId}/workflows`);
    return response.data;
  },
  
  get: async (workflowId: string): Promise<Workflow> => {
    const response = await api.get(`/workflows/${workflowId}`);
    return response.data;
  },
  
  create: async (projectId: string, data: WorkflowCreate): Promise<Workflow> => {
    const response = await api.post(`/projects/${projectId}/workflows`, data);
    return response.data;
  },
  
  update: async (workflowId: string, data: WorkflowUpdate): Promise<Workflow> => {
    const response = await api.put(`/workflows/${workflowId}`, data);
    return response.data;
  },
  
  delete: async (workflowId: string): Promise<void> => {
    await api.delete(`/workflows/${workflowId}`);
  },
  
  validate: async (definition: any): Promise<ValidationResult> => {
    const response = await api.post(`/workflows/validate`, definition);
    return response.data;
  },

  executeWorkflow: async (id: string, payload: any = {}): Promise<any> => {
    const response = await api.post(`/workflows/${id}/execute`, { payload });
    return response.data;
  },

  getExecutions: async (id: string): Promise<any[]> => {
    const response = await api.get(`/workflows/${id}/executions`);
    return response.data;
  },

  getExecution: async (executionId: string): Promise<any> => {
    const response = await api.get(`/workflows/executions/${executionId}`);
    return response.data;
  }
};
