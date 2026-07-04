"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CalendarClock, Database, Cog, FileText } from "lucide-react";

export function SchedulerDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const cronRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<HTMLDivElement>(null);
  const packetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      // Setup elements
      gsap.fromTo([cronRef.current, queueRef.current, workerRef.current],
        { opacity: 0, scale: 0.9 },
        { 
          opacity: 1, 
          scale: 1, 
          stagger: 0.2, 
          duration: 0.6,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          }
        }
      );

      // Create an infinite loop animation
      const tl = gsap.timeline({ repeat: -1, delay: 1 });

      // 1. Cron triggers
      tl.to(cronRef.current, { scale: 1.1, borderColor: "#a855f7", boxShadow: "0 0 20px rgba(168,85,247,0.5)", duration: 0.2 })
        .to(cronRef.current, { scale: 1, borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.4 }, "+=0.2");
      
      // 2. Job packet drops from Cron to Queue
      tl.set(packetRef.current, { opacity: 1, x: 0, y: 0, scale: 1 });
      
      tl.to(packetRef.current, {
        x: () => {
           const cRect = cronRef.current?.getBoundingClientRect();
           const qRect = queueRef.current?.getBoundingClientRect();
           if (cRect && qRect) return qRect.left - cRect.left;
           return 150;
        },
        y: () => {
           const cRect = cronRef.current?.getBoundingClientRect();
           const qRect = queueRef.current?.getBoundingClientRect();
           if (cRect && qRect) return qRect.top - cRect.top;
           return 0;
        },
        duration: 0.6,
        ease: "power2.inOut"
      }, "-=0.4");

      // 3. Packet enters queue, queue flashes
      tl.to(packetRef.current, { scale: 0, opacity: 0, duration: 0.2 });
      tl.to(queueRef.current, { scale: 1.1, borderColor: "#f59e0b", boxShadow: "0 0 20px rgba(245,158,11,0.5)", duration: 0.2 })
        .to(queueRef.current, { scale: 1, borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.4 }, "+=0.2");

      // 4. Packet leaves queue for worker
      tl.set(packetRef.current, { opacity: 1, scale: 0 });
      tl.to(packetRef.current, { scale: 1, duration: 0.2 });
      
      tl.to(packetRef.current, {
        x: () => {
           const cRect = cronRef.current?.getBoundingClientRect();
           const wRect = workerRef.current?.getBoundingClientRect();
           if (cRect && wRect) return wRect.left - cRect.left;
           return 300;
        },
        y: () => {
           const cRect = cronRef.current?.getBoundingClientRect();
           const wRect = workerRef.current?.getBoundingClientRect();
           if (cRect && wRect) return wRect.top - cRect.top;
           return 0;
        },
        duration: 0.6,
        ease: "power2.inOut"
      });

      // 5. Worker processes it
      tl.to(packetRef.current, { scale: 0, opacity: 0, duration: 0.2 });
      tl.to(workerRef.current, { scale: 1.1, borderColor: "#22c55e", boxShadow: "0 0 20px rgba(34,197,94,0.5)", duration: 0.2 });
      tl.to(".worker-cog", { rotation: 360, duration: 1, ease: "none" }, "<");
      tl.to(workerRef.current, { scale: 1, borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.2 });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 border-t border-border/50 bg-muted/10 relative overflow-hidden">
      <div className="container mx-auto max-w-screen-xl px-4 flex flex-col lg:flex-row items-center gap-12">
        
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 mb-6 text-purple-500">
            <CalendarClock className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Built-in Scheduler</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Recurring jobs made easy.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
            Run reports, clear caches, or send daily emails. Define schedules using standard cron syntax or visual builders, and our distributed scheduler will guarantee they execute precisely on time, no matter how many nodes you run.
          </p>
        </div>

        <div className="flex-1 w-full max-w-2xl relative min-h-[300px] flex items-center justify-center bg-card rounded-2xl border border-border shadow-xl p-8">
          
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-8 relative z-10">
            
            {/* Cron */}
            <div ref={cronRef} className="relative z-10 flex flex-col items-center p-6 bg-[#161b22] border border-border rounded-xl shadow-lg min-w-[140px]">
              <CalendarClock className="size-8 text-purple-500 mb-3" />
              <span className="text-sm font-semibold mb-1">Generate Report</span>
              <span className="text-xs font-mono text-muted-foreground bg-black/40 px-2 py-1 rounded">0 0 * * *</span>
            </div>

            {/* Queue */}
            <div ref={queueRef} className="relative z-10 flex flex-col items-center p-6 bg-[#161b22] border border-border rounded-xl shadow-lg min-w-[140px]">
              <Database className="size-8 text-amber-500 mb-3" />
              <span className="text-sm font-semibold">"reports"</span>
              <span className="text-xs text-muted-foreground mt-1">Queue</span>
            </div>

            {/* Worker */}
            <div ref={workerRef} className="relative z-10 flex flex-col items-center p-6 bg-[#161b22] border border-border rounded-xl shadow-lg min-w-[140px]">
              <Cog className="size-8 text-green-500 mb-3 worker-cog" />
              <span className="text-sm font-semibold">Worker Pool</span>
              <span className="text-xs text-muted-foreground mt-1">Processing...</span>
            </div>

          </div>

          {/* Animated Packet */}
          <div ref={packetRef} className="absolute left-[10%] top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.5)] opacity-0 z-50 pointer-events-none">
            <FileText className="size-4" />
          </div>

          {/* Connector Lines (Background) */}
          <div className="absolute top-1/2 left-[15%] right-[15%] h-px bg-gradient-to-r from-purple-500/20 via-amber-500/20 to-green-500/20 z-0" />

        </div>

      </div>
    </section>
  );
}
