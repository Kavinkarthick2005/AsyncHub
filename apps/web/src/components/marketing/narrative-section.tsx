"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertTriangle, ServerCrash, EyeOff, XCircle, Database, Server, Activity, CalendarClock, GitBranch, ShieldCheck } from "lucide-react";

export function NarrativeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const oldWayRef = useRef<HTMLDivElement>(null);
  const newWayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([oldWayRef.current, newWayRef.current], { opacity: 1, position: "relative" });
      return;
    }

    const ctx = gsap.context(() => {
      // Pin the entire container and animate between the two states
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=150%", // Scroll distance
          pin: true,
          scrub: 1,
        }
      });

      // Animate out the old way
      tl.to(oldWayRef.current, { 
        opacity: 0, 
        y: -50, 
        scale: 0.95,
        duration: 1 
      });

      // Animate in the new way
      tl.fromTo(newWayRef.current, 
        { opacity: 0, y: 50, scale: 0.95 }, 
        { opacity: 1, y: 0, scale: 1, duration: 1 },
        "-=0.5" // Overlap slightly
      );

      // Stagger in the feature items of the new way
      tl.fromTo(".new-feature", 
        { opacity: 0, x: -20 }, 
        { opacity: 1, x: 0, stagger: 0.2, duration: 1 },
        "-=0.5"
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative h-screen w-full bg-muted/20 border-t border-border/50 overflow-hidden flex items-center justify-center">
      
      <div className="container mx-auto max-w-screen-xl px-4 relative w-full h-full flex items-center justify-center">
        
        {/* The Old Way (Traditional Background Jobs) */}
        <div ref={oldWayRef} className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-12 p-8 md:p-16">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-muted-foreground">
              Traditional background jobs are a black box.
            </h2>
            <p className="mt-4 text-xl text-muted-foreground/80 max-w-lg">
              You write the code, dispatch the job, and hope for the best. When things break, they break silently.
            </p>
          </div>
          
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col items-center justify-center p-6 bg-background border border-border rounded-xl text-muted-foreground/60 gap-3">
              <EyeOff className="size-8" />
              <span className="font-medium">No Visibility</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-background border border-destructive/20 text-destructive/60 rounded-xl gap-3">
              <AlertTriangle className="size-8" />
              <span className="font-medium">Hidden Failures</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-background border border-destructive/20 text-destructive/60 rounded-xl gap-3">
              <ServerCrash className="size-8" />
              <span className="font-medium">Worker Crashes</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-background border border-border rounded-xl text-muted-foreground/60 gap-3">
              <XCircle className="size-8" />
              <span className="font-medium">No Auto-Retries</span>
            </div>
          </div>
        </div>

        {/* The New Way (AsyncHub) */}
        <div ref={newWayRef} className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-12 p-8 md:p-16 opacity-0 translate-y-[50px] pointer-events-none">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-6 text-primary">
              <ShieldCheck className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">The AsyncHub Way</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Total visibility.<br />
              Infinite scale.
            </h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-lg">
              Stop guessing. See exactly what your workers are doing in real-time, with guaranteed execution and automatic retries.
            </p>
          </div>
          
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="new-feature flex flex-col items-start p-6 bg-card border border-primary/20 rounded-xl shadow-lg hover:border-primary/50 transition-colors">
              <Database className="size-8 text-amber-500 mb-4" />
              <h3 className="font-semibold text-lg">Queues</h3>
              <p className="text-sm text-muted-foreground mt-1">Priority-based resilient storage.</p>
            </div>
            <div className="new-feature flex flex-col items-start p-6 bg-card border border-primary/20 rounded-xl shadow-lg hover:border-primary/50 transition-colors">
              <Server className="size-8 text-green-500 mb-4" />
              <h3 className="font-semibold text-lg">Workers</h3>
              <p className="text-sm text-muted-foreground mt-1">Scale horizontally across regions.</p>
            </div>
            <div className="new-feature flex flex-col items-start p-6 bg-card border border-primary/20 rounded-xl shadow-lg hover:border-primary/50 transition-colors">
              <Activity className="size-8 text-blue-500 mb-4" />
              <h3 className="font-semibold text-lg">Realtime</h3>
              <p className="text-sm text-muted-foreground mt-1">Live WebSockets dashboard.</p>
            </div>
            <div className="new-feature flex flex-col items-start p-6 bg-card border border-primary/20 rounded-xl shadow-lg hover:border-primary/50 transition-colors">
              <GitBranch className="size-8 text-purple-500 mb-4" />
              <h3 className="font-semibold text-lg">Workflows</h3>
              <p className="text-sm text-muted-foreground mt-1">Visual DAG orchestration.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
