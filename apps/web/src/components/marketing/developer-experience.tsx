"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play, Terminal, Cpu, LayoutDashboard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeveloperExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const processorRef = useRef<HTMLDivElement>(null);
  const dashUpdateRef = useRef<HTMLDivElement>(null);

  const packetRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([codeBlockRef.current, processorRef.current, dashUpdateRef.current], { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      // Entrance animation for the entire section
      gsap.fromTo([codeBlockRef.current, processorRef.current, dashUpdateRef.current],
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          stagger: 0.2, 
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          }
        }
      );
    }, containerRef);

    // Save the animation timeline so we can trigger it
    const animation = { play: () => {} };
    animation.play = () => {
      const tl = gsap.timeline();

      // Step 1: Click "Run" -> Packet shoots from Code to Processor
      tl.to(playButtonRef.current, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
      
      tl.set(packetRef.current, { opacity: 1, x: 0, y: 0, scale: 1 });
      
      tl.to(packetRef.current, {
        x: () => {
           const codeRect = codeBlockRef.current?.getBoundingClientRect();
           const procRect = processorRef.current?.getBoundingClientRect();
           if (codeRect && procRect) return procRect.left - codeRect.left + (procRect.width/2) - 40;
           return 200;
        },
        y: () => {
           const codeRect = codeBlockRef.current?.getBoundingClientRect();
           const procRect = processorRef.current?.getBoundingClientRect();
           if (codeRect && procRect) return procRect.top - codeRect.top;
           return 0;
        },
        duration: 0.6,
        ease: "power2.inOut"
      });

      // Step 2: Processing
      tl.to(packetRef.current, { scale: 0, opacity: 0, duration: 0.2 });
      tl.to(processorRef.current, { borderColor: "#3b82f6", boxShadow: "0 0 20px rgba(59,130,246,0.5)", duration: 0.2 });
      tl.to(".cpu-icon", { rotation: "+=360", duration: 1, ease: "none" }, "<");
      tl.to(processorRef.current, { borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.2 });

      // Step 3: Result to Dashboard
      tl.set(packetRef.current, { opacity: 1, scale: 0 });
      tl.to(packetRef.current, { scale: 1, duration: 0.2 });
      tl.to(packetRef.current, {
        x: () => {
           const codeRect = codeBlockRef.current?.getBoundingClientRect();
           const dashRect = dashUpdateRef.current?.getBoundingClientRect();
           if (codeRect && dashRect) return dashRect.left - codeRect.left + 20;
           return 400;
        },
        y: () => {
           const codeRect = codeBlockRef.current?.getBoundingClientRect();
           const dashRect = dashUpdateRef.current?.getBoundingClientRect();
           if (codeRect && dashRect) return dashRect.top - codeRect.top + 40;
           return 0;
        },
        duration: 0.6,
        ease: "power2.inOut"
      });

      tl.to(packetRef.current, { opacity: 0, scale: 0, duration: 0.2 });
      tl.to(dashUpdateRef.current, { borderColor: "#22c55e", boxShadow: "0 0 20px rgba(34,197,94,0.5)", duration: 0.2 });
      
      // Update text in dashboard
      tl.to(statusRef.current, { 
        opacity: 0, 
        duration: 0.1, 
        onComplete: () => {
          if (statusRef.current) {
            statusRef.current.innerText = "Completed";
            statusRef.current.className = "text-green-500 font-medium";
          }
        }
      });
      tl.to(statusRef.current, { opacity: 1, duration: 0.2 });
      tl.to(dashUpdateRef.current, { borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.5, delay: 0.5 });
      
      // Reset text after a few seconds
      tl.to(statusRef.current, {
        opacity: 0,
        duration: 0.2,
        delay: 2,
        onComplete: () => {
          if (statusRef.current) {
            statusRef.current.innerText = "Waiting...";
            statusRef.current.className = "text-muted-foreground";
          }
        }
      });
      tl.to(statusRef.current, { opacity: 1, duration: 0.2 });
    };

    const runBtn = playButtonRef.current;
    if (runBtn) {
      runBtn.addEventListener("click", animation.play);
    }

    return () => {
      if (runBtn) runBtn.removeEventListener("click", animation.play);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={containerRef} className="py-24 border-t border-border/50 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-screen-xl px-4 text-center">
        
        <div className="mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 mb-6 text-blue-500">
            <Terminal className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Developer Experience</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Type-safe. Intuitive. Fast.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Enqueueing a job is as simple as calling a function. Watch it seamlessly execute and report back to your dashboard in milliseconds.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 relative max-w-5xl mx-auto">
          
          {/* 1. Code Block */}
          <div ref={codeBlockRef} className="relative z-10 w-full lg:w-[400px] bg-[#0d1117] rounded-xl border border-border shadow-xl text-left overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border">
              <span className="text-xs font-mono text-muted-foreground">producer.ts</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
            </div>
            <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-slate-300">
              <pre>
                <span className="text-purple-400">await</span> client.<span className="text-blue-400">enqueue</span>({`{`}
                <br/>  <span className="text-blue-300">queue</span>: <span className="text-amber-300">"emails"</span>,
                <br/>  <span className="text-blue-300">payload</span>: {`{`}
                <br/>    <span className="text-blue-300">userId</span>: <span className="text-orange-300">42</span>,
                <br/>    <span className="text-blue-300">template</span>: <span className="text-amber-300">"welcome"</span>
                <br/>  {`}`}
                <br/>{`}`});
              </pre>
            </div>
            <div className="p-4 border-t border-border bg-[#161b22] flex justify-end">
              <Button ref={playButtonRef} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Play className="size-4 mr-2" /> Execute Code
              </Button>
            </div>
            {/* The animated packet that moves out from the code block */}
            <div ref={packetRef} className="absolute bottom-8 right-8 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] opacity-0 z-50 pointer-events-none" />
          </div>

          {/* Connectors (visible on desktop) */}
          <div className="hidden lg:block h-px w-16 bg-gradient-to-r from-border to-transparent" />

          {/* 2. Processing Node */}
          <div ref={processorRef} className="relative z-10 flex flex-col items-center justify-center p-6 bg-card border border-border rounded-full w-32 h-32 shadow-lg shrink-0 transition-colors">
            <Cpu className="size-10 text-muted-foreground cpu-icon" />
            <span className="text-xs font-medium mt-2 text-muted-foreground">Workers</span>
          </div>

          {/* Connectors (visible on desktop) */}
          <div className="hidden lg:block h-px w-16 bg-gradient-to-l from-border to-transparent" />

          {/* 3. Dashboard Update */}
          <div ref={dashUpdateRef} className="relative z-10 w-full lg:w-[320px] bg-card rounded-xl border border-border shadow-xl text-left overflow-hidden transition-colors">
             <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
               <LayoutDashboard className="size-4 text-purple-500" />
               <span className="text-sm font-medium">Live Dashboard</span>
             </div>
             <div className="p-4 space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Job ID</span>
                 <span className="font-mono">job_9f82...</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Queue</span>
                 <span className="font-mono text-amber-500">emails</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Status</span>
                 <span ref={statusRef} className="text-muted-foreground font-medium">Waiting...</span>
               </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
