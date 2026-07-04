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
      // Scroll reveal for title
      gsap.from(".arch-title", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      });

      // Scroll reveal for nodes
      gsap.fromTo(
        nodesRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: ".arch-grid",
            start: "top 80%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="architecture" className="py-24 border-t border-border/50 bg-muted/10 relative overflow-hidden">
      <div className="container mx-auto max-w-screen-xl px-4">
        
        <div className="arch-title text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">A resilient architecture.</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            AsyncHub is built on top of rock-solid technologies you already trust. Hover over the components to see how data flows through the system.
          </p>
        </div>

        <div className="arch-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {ARCHITECTURE_NODES.map((node, i) => (
            <div
              key={node.id}
              ref={el => { nodesRef.current[i] = el; }}
              className={cn(
                "group relative flex flex-col p-6 rounded-2xl border bg-card/50 backdrop-blur-sm",
                "transition-all duration-500 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-default",
                node.border,
                activeNode === node.id ? "border-primary/50" : ""
              )}
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
            >
              {/* Subtle hover glow background */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                   style={{ background: `radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)` }} />
                   
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", node.bg)}>
                <node.icon className={cn("size-6", node.color)} />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{node.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{node.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
