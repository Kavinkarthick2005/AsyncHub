"use client";

import React, { useEffect, useRef, useState } from "react";
import { ReactFlow, Background, Node, Edge, Position, MarkerType, useNodesState, useEdgesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitBranch, Image, Tag, Upload, Bell, Play } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Node Component for the DAG animation
function WorkflowNode({ data, selected }: { data: { label: string, icon: any, status: 'pending' | 'running' | 'completed' }, selected: boolean }) {
  const Icon = data.icon;
  
  return (
    <div className={cn(
      "px-4 py-3 rounded-lg border-2 shadow-lg bg-card min-w-[160px] transition-all duration-500",
      data.status === 'pending' ? "border-border/50 text-muted-foreground" : "",
      data.status === 'running' ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] text-foreground scale-105" : "",
      data.status === 'completed' ? "border-green-500 text-foreground" : "",
      selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex shrink-0 items-center justify-center size-8 rounded-full",
          data.status === 'pending' ? "bg-muted" : "",
          data.status === 'running' ? "bg-blue-500/20 text-blue-500 animate-pulse" : "",
          data.status === 'completed' ? "bg-green-500/20 text-green-500" : ""
        )}>
          <Icon className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{data.label}</span>
          <span className={cn(
            "text-xs capitalize font-mono",
            data.status === 'running' ? "text-blue-500" : "",
            data.status === 'completed' ? "text-green-500" : "text-muted-foreground"
          )}>{data.status}</span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { custom: WorkflowNode };

const initialNodes: Node[] = [
  { id: '1', type: 'custom', position: { x: 50, y: 150 }, data: { label: 'Start Job', icon: Play, status: 'pending' }, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: '2', type: 'custom', position: { x: 300, y: 50 }, data: { label: 'Resize Image', icon: Image, status: 'pending' }, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: '3', type: 'custom', position: { x: 300, y: 250 }, data: { label: 'Add Watermark', icon: Tag, status: 'pending' }, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: '4', type: 'custom', position: { x: 550, y: 150 }, data: { label: 'Upload to S3', icon: Upload, status: 'pending' }, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: '5', type: 'custom', position: { x: 800, y: 150 }, data: { label: 'Notify User', icon: Bell, status: 'pending' }, sourcePosition: Position.Right, targetPosition: Position.Left },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: false, style: { stroke: 'hsl(var(--muted-foreground))' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' } },
  { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', animated: false, style: { stroke: 'hsl(var(--muted-foreground))' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' } },
  { id: 'e2-4', source: '2', target: '4', type: 'smoothstep', animated: false, style: { stroke: 'hsl(var(--muted-foreground))' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' } },
  { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', animated: false, style: { stroke: 'hsl(var(--muted-foreground))' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' } },
  { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', animated: false, style: { stroke: 'hsl(var(--muted-foreground))' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' } },
];

export function WorkflowPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Animation state machine
  useEffect(() => {
    let currentStep = 0;
    let timer: NodeJS.Timeout;

    // Reset everything
    const reset = () => {
      setNodes((nds) => nds.map(n => ({ ...n, data: { ...n.data, status: 'pending' } })));
      setEdges((eds) => eds.map(e => ({ 
        ...e, 
        animated: false, 
        style: { stroke: 'hsl(var(--muted-foreground))' },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' }
      })));
    };

    const runStep = () => {
      switch (currentStep) {
        case 0:
          reset();
          // Start node running
          setNodes((nds) => nds.map(n => n.id === '1' ? { ...n, data: { ...n.data, status: 'running' } } : n));
          timer = setTimeout(() => { currentStep++; runStep(); }, 1000);
          break;
        case 1:
          // Start node completed, branches running
          setNodes((nds) => nds.map(n => {
            if (n.id === '1') return { ...n, data: { ...n.data, status: 'completed' } };
            if (n.id === '2' || n.id === '3') return { ...n, data: { ...n.data, status: 'running' } };
            return n;
          }));
          setEdges((eds) => eds.map(e => {
            if (e.id === 'e1-2' || e.id === 'e1-3') {
              return { ...e, animated: true, style: { stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } };
            }
            return e;
          }));
          timer = setTimeout(() => { currentStep++; runStep(); }, 1500);
          break;
        case 2:
          // Branches completed, Upload running
          setNodes((nds) => nds.map(n => {
            if (n.id === '2' || n.id === '3') return { ...n, data: { ...n.data, status: 'completed' } };
            if (n.id === '4') return { ...n, data: { ...n.data, status: 'running' } };
            return n;
          }));
          setEdges((eds) => eds.map(e => {
            if (e.id === 'e1-2' || e.id === 'e1-3') {
              return { ...e, animated: false, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' } };
            }
            if (e.id === 'e2-4' || e.id === 'e3-4') {
              return { ...e, animated: true, style: { stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } };
            }
            return e;
          }));
          timer = setTimeout(() => { currentStep++; runStep(); }, 1200);
          break;
        case 3:
          // Upload completed, Notify running
          setNodes((nds) => nds.map(n => {
            if (n.id === '4') return { ...n, data: { ...n.data, status: 'completed' } };
            if (n.id === '5') return { ...n, data: { ...n.data, status: 'running' } };
            return n;
          }));
          setEdges((eds) => eds.map(e => {
            if (e.id === 'e2-4' || e.id === 'e3-4') {
              return { ...e, animated: false, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' } };
            }
            if (e.id === 'e4-5') {
              return { ...e, animated: true, style: { stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } };
            }
            return e;
          }));
          timer = setTimeout(() => { currentStep++; runStep(); }, 1000);
          break;
        case 4:
          // Notify completed. All done.
          setNodes((nds) => nds.map(n => n.id === '5' ? { ...n, data: { ...n.data, status: 'completed' } } : n));
          setEdges((eds) => eds.map(e => {
            if (e.id === 'e4-5') {
              return { ...e, animated: false, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' } };
            }
            return e;
          }));
          timer = setTimeout(() => { currentStep = 0; runStep(); }, 2500); // Wait then restart
          break;
      }
    };

    // Use IntersectionObserver to only run animation when in view
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (currentStep === 0) runStep();
      } else {
        clearTimeout(timer);
        currentStep = 0;
        reset();
      }
    }, { threshold: 0.5 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [setNodes, setEdges]);

  return (
    <section ref={containerRef} className="py-24 border-t border-border/50 bg-background overflow-hidden relative">
      <div className="container mx-auto max-w-screen-xl px-4">
        
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 mb-6 text-purple-500">
            <GitBranch className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Visual DAG Workflows</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Orchestrate complex logic.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Chain jobs together with dependencies. Handle parallel execution, conditional branching, and automatic retries all from our built-in workflow engine.
          </p>
        </div>

        <div className="w-full max-w-5xl mx-auto h-[400px] bg-card rounded-2xl border border-border shadow-xl overflow-hidden relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            colorMode="dark"
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll={false}
            panOnScroll={false}
          >
            <Background gap={16} color="rgba(255,255,255,0.05)" />
          </ReactFlow>
        </div>

      </div>
    </section>
  );
}
