"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { Server, Database, Activity, Code, Send, LayoutDashboard, RefreshCcw, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  
  // Animation Nodes
  const apiRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);
  const workerARef = useRef<HTMLDivElement>(null);
  const workerBRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([titleRef.current, textRef.current, buttonsRef.current], { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Text Entry Animations
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.1 }
      );
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.3 }
      );
      gsap.fromTo(
        buttonsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.5 }
      );

      // 2. Infinite Orchestration Animation Loop
      const tl = gsap.timeline({ repeat: -1, delay: 1 });
      
      // Flash API
      tl.to(apiRef.current, { scale: 1.05, borderColor: "#3b82f6", boxShadow: "0 0 15px rgba(59,130,246,0.5)", duration: 0.2 })
        .to(apiRef.current, { scale: 1, borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.4 }, "+=0.2");
        
      // Flow API -> Queue (animate path 1)
      tl.fromTo("#path-api-queue", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, "-=0.4");
      
      // Flash Queue
      tl.to(queueRef.current, { scale: 1.05, borderColor: "#f59e0b", boxShadow: "0 0 15px rgba(245,158,11,0.5)", duration: 0.2 }, "-=0.1")
        .to(queueRef.current, { scale: 1, borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.4 }, "+=0.3");

      // Flow Queue -> Workers (animate paths 2a & 2b)
      tl.fromTo("#path-queue-workerA", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, "-=0.4");
      tl.fromTo("#path-queue-workerB", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, "<");

      // Flash Workers
      tl.to([workerARef.current, workerBRef.current], { scale: 1.05, borderColor: "#22c55e", boxShadow: "0 0 15px rgba(34,197,94,0.5)", duration: 0.2 }, "-=0.1")
        .to([workerARef.current, workerBRef.current], { scale: 1, borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.4 }, "+=0.5");

      // Flow Workers -> Dashboard
      tl.fromTo("#path-workerA-dash", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, "-=0.4");
      tl.fromTo("#path-workerB-dash", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, "<");

      // Flash Dashboard
      tl.to(dashboardRef.current, { scale: 1.05, borderColor: "#a855f7", boxShadow: "0 0 15px rgba(168,85,247,0.5)", duration: 0.2 }, "-=0.1")
        .to(dashboardRef.current, { scale: 1, borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.4 }, "+=0.5");

      // Reset paths for next loop
      tl.set(["#path-api-queue", "#path-queue-workerA", "#path-queue-workerB", "#path-workerA-dash", "#path-workerB-dash"], { strokeDashoffset: 100 });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32" ref={containerRef}>
      <div className="container mx-auto max-w-screen-xl px-4 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left: Text Content */}
        <div className="text-left z-10 flex flex-col items-start">
          <div className="inline-flex items-center space-x-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 backdrop-blur transition-all mb-6">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">Introducing AsyncHub 1.0</span>
          </div>
          <h1 ref={titleRef} className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl opacity-0">
            Reliable distributed <br />
            <span className="text-muted-foreground">job orchestration.</span>
          </h1>
          <p ref={textRef} className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl opacity-0">
            Enterprise-grade background job processing, workflow orchestration, and scheduling for modern development teams. Zero operational overhead.
          </p>
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 mt-10 opacity-0">
            <Button size="lg" className="h-12 px-8 text-base bg-amber-600 hover:bg-amber-700 text-white" render={<Link href="/signup" />}>
              Start Building Free
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" render={<Link href="/docs" />}>
              Read the Docs
            </Button>
          </div>
        </div>

        {/* Right: Live Orchestration Simulation */}
        <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square max-w-lg mx-auto flex items-center justify-center pointer-events-none">
          {/* Subtle Glow Background */}
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px]" />
          
          <div className="relative w-full h-full flex flex-col items-center justify-between py-8">
            
            {/* API Request */}
            <div ref={apiRef} className="z-10 flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card shadow-lg w-40">
              <Send className="size-6 text-blue-500" />
              <span className="text-sm font-mono font-medium">API Request</span>
            </div>

            {/* Path 1 */}
            <div className="absolute top-[18%] left-1/2 w-[2px] h-[15%] -translate-x-1/2 z-0">
              <svg width="2" height="100%" className="overflow-visible">
                <line x1="1" y1="0" x2="1" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                <line id="path-api-queue" x1="1" y1="0" x2="1" y2="100%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="100" strokeDashoffset="100" />
              </svg>
            </div>

            {/* Queue */}
            <div ref={queueRef} className="z-10 flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card shadow-lg w-48 mt-8">
              <Database className="size-6 text-amber-500" />
              <span className="text-sm font-mono font-medium">Queue "emails"</span>
            </div>

            {/* Paths to Workers */}
            <div className="absolute top-[48%] left-1/2 w-full max-w-[240px] h-[15%] -translate-x-1/2 z-0">
              <svg width="100%" height="100%" className="overflow-visible" preserveAspectRatio="none">
                {/* Background dashed lines */}
                <path d="M 120 0 C 120 40, 20 40, 20 80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 120 0 C 120 40, 220 40, 220 80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                {/* Animated lines */}
                <path id="path-queue-workerA" d="M 120 0 C 120 40, 20 40, 20 80" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="100" strokeDashoffset="100" />
                <path id="path-queue-workerB" d="M 120 0 C 120 40, 220 40, 220 80" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="100" strokeDashoffset="100" />
              </svg>
            </div>

            {/* Workers */}
            <div className="z-10 flex w-full max-w-[320px] justify-between mt-8">
              <div ref={workerARef} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card shadow-lg w-32">
                <Server className="size-6 text-green-500" />
                <span className="text-sm font-mono font-medium">Worker A</span>
              </div>
              <div ref={workerBRef} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card shadow-lg w-32">
                <Server className="size-6 text-green-500" />
                <span className="text-sm font-mono font-medium">Worker B</span>
              </div>
            </div>

            {/* Paths to Dashboard */}
            <div className="absolute top-[78%] left-1/2 w-full max-w-[240px] h-[15%] -translate-x-1/2 z-0">
              <svg width="100%" height="100%" className="overflow-visible" preserveAspectRatio="none">
                <path d="M 20 0 C 20 40, 120 40, 120 80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 220 0 C 220 40, 120 40, 120 80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                
                <path id="path-workerA-dash" d="M 20 0 C 20 40, 120 40, 120 80" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="100" strokeDashoffset="100" />
                <path id="path-workerB-dash" d="M 220 0 C 220 40, 120 40, 120 80" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="100" strokeDashoffset="100" />
              </svg>
            </div>

            {/* Dashboard */}
            <div ref={dashboardRef} className="z-10 flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card shadow-lg w-48 mt-8">
              <LayoutDashboard className="size-6 text-purple-500" />
              <span className="text-sm font-mono font-medium">Dashboard UI</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
