"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { 
  ReactFlow, 
  Controls, 
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowsApi, ValidationResult } from "@/lib/api/workflows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Play, CheckCircle2, XCircle, Undo2, Redo2, LayoutTemplate, AlertTriangle, Zap, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useParams, useRouter } from "next/navigation";

// Schema for different node types
const NODE_SCHEMAS: Record<string, { label: string, fields: { name: string, label: string, type: string, placeholder?: string }[] }> = {
  queue: {
    label: "Queue",
    fields: [
      { name: "queue", label: "Queue Name", type: "text", placeholder: "default" },
      { name: "priority", label: "Priority", type: "number", placeholder: "10" }
    ]
  },
  handler: {
    label: "Handler",
    fields: [
      { name: "handler", label: "Handler Function", type: "text", placeholder: "process_data" }
    ]
  },
  condition: {
    label: "Condition",
    fields: [
      { name: "expression", label: "Expression", type: "text", placeholder: "job.result == 'success'" }
    ]
  }
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 25,
      },
    } as Node;
  });

  return { nodes: newNodes, edges };
};

export default function WorkflowBuilderPage(props: { params: Promise<{ id: string }> }) {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const queryClient = useQueryClient();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // Undo/Redo State
  const [history, setHistory] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saveState, setSaveState] = useState<"Unsaved" | "Saving..." | "Saved">("Saved");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [executePayload, setExecutePayload] = useState("{}");
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);

  const { data: workflow, isLoading } = useQuery({
    queryKey: ["workflows", workflowId],
    queryFn: () => workflowsApi.get(workflowId),
    enabled: !!workflowId,
  });

  // Initialize state from workflow
  useEffect(() => {
    if (workflow && history.length === 0) {
      const initialNodes = workflow.definition?.nodes || [];
      const initialEdges = workflow.definition?.edges || [];
      setNodes(initialNodes);
      setEdges(initialEdges);
      setHistory([{ nodes: initialNodes, edges: initialEdges }]);
      setHistoryIndex(0);
    }
  }, [workflow]);

  const pushToHistory = (newNodes: Node[], newEdges: Edge[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, edges: newEdges });
    // Keep max 50 states
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSaveState("Unsaved");
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex(historyIndex - 1);
      setSaveState("Unsaved");
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex(historyIndex + 1);
      setSaveState("Unsaved");
    }
  };

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const next = applyNodeChanges(changes, nds);
      // Only push to history if it's not just a selection change to avoid spam
      const hasMeaningfulChange = changes.some(c => c.type !== 'select');
      if (hasMeaningfulChange) {
        // Debounce or just push if structural
        pushToHistory(next, edges);
      }
      return next;
    });
  }, [edges, history, historyIndex]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => {
      const next = applyEdgeChanges(changes, eds);
      pushToHistory(nodes, next);
      return next;
    });
  }, [nodes, history, historyIndex]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => {
      const next = addEdge(connection, eds);
      pushToHistory(nodes, next);
      return next;
    });
  }, [nodes, history, historyIndex]);

  const onLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
    pushToHistory(layouted.nodes, layouted.edges);
  }, [nodes, edges]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setSaveState("Saving...");
      // Auto-validate locally for status but don't block save
      let status: 'draft' | 'valid' | 'invalid' = 'draft';
      if (validation) {
        status = validation.valid ? 'valid' : 'invalid';
      }
      
      return workflowsApi.update(workflowId, {
        definition: { nodes, edges },
        status
      });
    },
    onSuccess: (updated) => {
      setSaveState("Saved");
      queryClient.setQueryData(["workflows", workflowId], updated);
    },
    onError: () => {
      setSaveState("Unsaved");
      alert("Failed to save workflow");
    }
  });

  const validateMutation = useMutation({
    mutationFn: async () => workflowsApi.validate({ nodes, edges }),
    onSuccess: (result) => {
      setValidation(result);
    }
  });

  const executeMutation = useMutation({
    mutationFn: async (payload: any) => workflowsApi.executeWorkflow(workflowId, payload),
    onSuccess: () => {
      setExecuteDialogOpen(false);
      // Redirect to executions page
      router.push(`/workflows/${workflowId}/executions`);
    },
    onError: (err) => {
      alert("Execution failed: " + err);
    }
  });

  const handleSave = () => saveMutation.mutate();
  const handleValidate = () => validateMutation.mutate();
  const handleExecute = () => {
    try {
      const parsed = JSON.parse(executePayload);
      executeMutation.mutate(parsed);
    } catch(e) {
      alert("Invalid JSON payload");
    }
  };

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: `New ${NODE_SCHEMAS[type].label}`, type, ...Object.fromEntries(NODE_SCHEMAS[type].fields.map(f => [f.name, ""])) },
    };
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    pushToHistory(nextNodes, edges);
  };

  const updateNodeData = (nodeId: string, key: string, value: string) => {
    const nextNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: { ...n.data, [key]: value, label: key === 'queue' || key === 'handler' ? `${n.data.type}: ${value}` : n.data.label }
        };
      }
      return n;
    });
    setNodes(nextNodes);
    pushToHistory(nextNodes, edges);
    
    // Update selected node so sidebar re-renders immediately
    if (selectedNode?.id === nodeId) {
      setSelectedNode(nextNodes.find(n => n.id === nodeId) || null);
    }
  };

  if (isLoading) return <div>Loading builder...</div>;

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Top Toolbar */}
      <div className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{workflow?.name || 'Workflow Builder'}</h2>
          
          <div className="flex items-center gap-2 border-l pl-4 ml-2">
            <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 border-l pl-4 ml-2">
            {Object.keys(NODE_SCHEMAS).map(type => (
              <Button key={type} variant="outline" size="sm" onClick={() => addNode(type)}>
                + {NODE_SCHEMAS[type].label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm text-muted-foreground mr-4">
            {saveState === 'Saved' && <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />}
            {saveState === 'Saving...' && <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />}
            {saveState === 'Unsaved' && <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />}
            {saveState}
          </div>
          <Button variant="secondary" onClick={onLayout}>
            <LayoutTemplate className="mr-2 h-4 w-4" /> Auto Layout
          </Button>
          <Button variant="secondary" onClick={handleValidate} disabled={validateMutation.isPending}>
            <Play className="mr-2 h-4 w-4" /> Validate
          </Button>
          <Button 
            variant="default" 
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => setExecuteDialogOpen(true)}
            disabled={saveState !== 'Saved' || (workflow?.status !== 'valid' && !validation?.valid)}
          >
            <Zap className="mr-2 h-4 w-4" /> Execute
          </Button>
          <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Execute Workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Initial Payload (JSON)</Label>
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={executePayload}
                    onChange={e => setExecutePayload(e.target.value)}
                    placeholder='{"key": "value"}'
                  />
                </div>
                <Button onClick={handleExecute} disabled={executeMutation.isPending} className="w-full">
                  {executeMutation.isPending ? "Executing..." : "Run Workflow"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSave} disabled={saveState === 'Saved' || saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      {/* Main Canvas & Sidebars */}
      <div className="flex flex-1 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onPaneClick={() => setSelectedNode(null)}
          colorMode="dark"
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>

        {/* Validation Panel */}
        {validation && (
          <div className="absolute bottom-4 left-4 z-10 w-80 bg-background border rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold flex items-center">
                {validation.valid ? (
                  <><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" /> Valid Workflow</>
                ) : (
                  <><XCircle className="h-4 w-4 text-destructive mr-2" /> Validation Errors</>
                )}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setValidation(null)} className="h-6 w-6">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            {!validation.valid && (
              <ul className="text-sm text-destructive list-disc pl-4 space-y-1 max-h-40 overflow-y-auto">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Node Configuration Sidebar */}
        {selectedNode && (
          <div className="w-80 border-l bg-background p-4 overflow-y-auto z-10 shadow-xl">
            <h3 className="font-semibold mb-4 text-lg">Node Configuration</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Node ID</Label>
                <Input value={selectedNode.id} disabled />
              </div>
              
              {selectedNode.data?.type && NODE_SCHEMAS[selectedNode.data.type as string] ? (
                NODE_SCHEMAS[selectedNode.data.type as string].fields.map(field => (
                  <div key={field.name} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input 
                      type={field.type}
                      placeholder={field.placeholder}
                      value={(selectedNode.data[field.name] as string) || ""}
                      onChange={(e) => updateNodeData(selectedNode.id, field.name, e.target.value)}
                    />
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Select a specific node type to configure properties.</div>
              )}
              
              <Button 
                variant="destructive" 
                className="w-full mt-4"
                onClick={() => {
                  const nextNodes = nodes.filter(n => n.id !== selectedNode.id);
                  const nextEdges = edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id);
                  setNodes(nextNodes);
                  setEdges(nextEdges);
                  setSelectedNode(null);
                  pushToHistory(nextNodes, nextEdges);
                }}
              >
                Delete Node
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
