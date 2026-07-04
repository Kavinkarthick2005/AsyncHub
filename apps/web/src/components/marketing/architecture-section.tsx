"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Code, Server, Database, Activity, LayoutDashboard, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ARCHITECTURE_NODES = [
  {
    id: "client",
    title: "Client",
    icon: Code,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    description: "Your application enqueues jobs via our lightweight SDKs or directly through the REST API."
  },
  {
    id: "api",
    title: "API Gateway",
    icon: Share2,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    description: "Authenticates requests, performs payload validation, and routes jobs to the correct project queue."
  },
  {
    id: "queue",
    title: "Queue",
    icon: Database,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    description: "Durable, priority-based storage using PostgreSQL SKIP LOCKED for high-throughput concurrency."
  },
  {
    id: "worker",
    title: "Workers",
    icon: Server,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    description: "Scalable worker nodes long-poll the queues and execute job handlers with automatic retries."
  },
  {
    id: "postgres",
    title: "PostgreSQL",
    icon: Database,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/30",
    description: "The source of truth. Handles transactional state changes and leverages LISTEN/NOTIFY for events."
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    description: "Realtime WebSocket connected UI to monitor operations, queues, and workflow executions."
  }
];

export function ArchitectureSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(nodesRef.current, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        nodesRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="architecture" className="py-24 border-t border-border/50 bg-muted/10 relative overflow-hidden">
      <div className="container mx-auto max-w-screen-xl px-4">
        
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            A resilient architecture.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            AsyncHub is built on top of rock-solid technologies you already trust. Hover over the components to see how data flows through the system.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
          {ARCHITECTURE_NODES.map((node, i) => (
            <div
              key={node.id}
              ref={el => { nodesRef.current[i] = el }}
              className={cn(
                "relative group flex flex-col p-6 rounded-2xl border bg-card cursor-pointer transition-all duration-300",
                activeNode === node.id ? "scale-105 border-primary shadow-2xl z-20" : "border-border hover:border-primary/50"
              )}
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
            >
              <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 transition-colors", node.bg, node.color, activeNode === node.id ? "ring-2 ring-primary/50" : "")}>
                <node.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{node.title}</h3>
              
              {/* The description is always rendered but its opacity changes for a smooth reveal effect on hover */}
              <p className={cn(
                "text-sm text-muted-foreground transition-all duration-300",
                activeNode === node.id ? "opacity-100 h-auto translate-y-0" : "opacity-70 h-10 overflow-hidden"
              )}>
                {node.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
