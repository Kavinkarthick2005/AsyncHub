"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ReactFlow, 
  Background,
  Controls,
  Node,
  Edge,
  Panel,
  MarkerType
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { useQuery } from "@tanstack/react-query";
import { workflowsApi } from "@/lib/api/workflows";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCcw, Activity, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const getStatusColorClass = (nodeId: string, state: any) => {
  if (!state) return "bg-muted text-muted-foreground border-border";
  if (state.completed?.includes(nodeId)) return "bg-green-100 text-green-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
  if (state.running?.includes(nodeId)) return "bg-blue-100 text-blue-800 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse";
  if (state.failed?.includes(nodeId)) return "bg-red-100 text-red-800 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
  if (state.waiting?.includes(nodeId)) return "bg-slate-100 text-slate-800 border-slate-400";
  return "bg-background text-foreground border-border"; // default/unreached
};

export default function ExecutionDetailView(props: { params: Promise<{ id: string, executionId: string }> }) {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const executionId = params.executionId as string;
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const { data: workflow } = useQuery({
    queryKey: ["workflows", workflowId],
    queryFn: () => workflowsApi.get(workflowId),
  });

  const { data: execution, isLoading, refetch } = useQuery({
    queryKey: ["workflow-executions", executionId],
    queryFn: () => workflowsApi.getExecution(executionId),
    refetchInterval: (query) => {
      // Poll if running
      const state = query.state.data;
      if (state?.status === 'running') return 2000;
      return false;
    }
  });

  // Reconstruct nodes and edges from workflow definition, coloring them by execution state
  const { nodes, edges } = useMemo(() => {
    if (!workflow?.definition) return { nodes: [], edges: [] };
    
    const baseNodes = workflow.definition.nodes || [];
    const baseEdges = workflow.definition.edges || [];
    
    const styledNodes = baseNodes.map((node: Node) => ({
      ...node,
      draggable: false,
      selectable: true,
      className: `border-2 rounded-md ${getStatusColorClass(node.id, execution?.current_state)}`,
    }));

    const styledEdges = baseEdges.map((edge: Edge) => {
      // Color edges based on source node status
      let stroke = '#b1b1b7';
      if (execution?.current_state?.completed?.includes(edge.source)) stroke = '#22c55e'; // green
      else if (execution?.current_state?.failed?.includes(edge.source)) stroke = '#ef4444'; // red
      
      return {
        ...edge,
        animated: execution?.current_state?.running?.includes(edge.source) || execution?.current_state?.running?.includes(edge.target),
        style: { stroke, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke }
      };
    });

    return { nodes: styledNodes, edges: styledEdges };
  }, [workflow, execution]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNodeStateLabel = (nodeId: string) => {
    const s = execution?.current_state;
    if (!s) return "Unknown";
    if (s.completed?.includes(nodeId)) return "Completed";
    if (s.running?.includes(nodeId)) return "Running";
    if (s.failed?.includes(nodeId)) return "Failed";
    if (s.waiting?.includes(nodeId)) return "Waiting";
    return "Not Reached";
  };

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Top Toolbar */}
      <div className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href={`/workflows/${workflowId}/executions`} />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Execution Detail {execution && getStatusBadge(execution.status)}
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {executionId}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          colorMode="dark"
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onPaneClick={() => setSelectedNode(null)}
        >
          <Background />
          <Controls />
          
          <Panel position="top-left" className="bg-background/80 backdrop-blur border rounded shadow-sm p-3 m-4 pointer-events-none">
            <div className="text-sm font-medium mb-2">Execution Overview</div>
            {execution ? (
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>Started: {new Date(execution.started_at).toLocaleString()}</div>
                <div>Completed: {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : '-'}</div>
                <div>Duration: {execution.completed_at ? `${((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(1)}s` : '-'}</div>
              </div>
            ) : (
              <div className="text-xs">Loading...</div>
            )}
          </Panel>
        </ReactFlow>

        {/* Node Detail Sidebar */}
        {selectedNode && (
          <div className="w-80 border-l bg-background p-4 overflow-y-auto z-10 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedNode.data?.label as string || selectedNode.id}</h3>
              <p className="text-sm text-muted-foreground font-mono mt-1">{selectedNode.id}</p>
            </div>
            
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-2 font-medium">
                  {(() => {
                    const state = getNodeStateLabel(selectedNode.id);
                    if (state === "Completed") return <><CheckCircle2 className="h-4 w-4 text-green-500" /> Completed</>;
                    if (state === "Running") return <><Activity className="h-4 w-4 text-blue-500" /> Running</>;
                    if (state === "Failed") return <><AlertCircle className="h-4 w-4 text-red-500" /> Failed</>;
                    if (state === "Waiting") return <><Clock className="h-4 w-4 text-slate-500" /> Waiting</>;
                    return <span className="text-muted-foreground">Not Reached</span>;
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-sm space-y-2">
                {Object.entries(selectedNode.data || {}).map(([key, val]) => {
                  if (key === 'label') return null;
                  return (
                    <div key={key} className="flex flex-col border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <span className="text-muted-foreground capitalize text-xs">{key}</span>
                      <span className="font-mono mt-1 break-all">{String(val)}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
          </div>
        )}
      </div>
    </div>
  );
}
