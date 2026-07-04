"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Code, Database, Server, Cog, RotateCcw, CheckCircle, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STEPS = [
  { id: 1, title: "Client sends request", icon: Code },
  { id: 2, title: "Job enters Queue", icon: Database },
  { id: 3, title: "Worker claims job", icon: Server },
  { id: 4, title: "Processing", icon: Cog },
  { id: 5, title: "Retry (optional)", icon: RotateCcw },
  { id: 6, title: "Completed", icon: CheckCircle },
  { id: 7, title: "Dashboard updates instantly", icon: LayoutDashboard },
];

export function HowItWorksTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      // Simple stagger reveal for steps
      gsap.from(stepsRef.current, {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        }
      });
      
      // Animate the line
      gsap.fromTo(lineRef.current,
        { height: "0%" },
        { 
          height: "100%",
          duration: 1.5,
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="how-it-works" className="relative bg-background border-t border-border/50 py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How AsyncHub Works</h2>
          <p className="mt-4 text-lg text-muted-foreground">The lifecycle of a background job</p>
        </div>

        <div className="relative flex flex-col gap-8 w-full max-w-lg mx-auto">
          
          {/* Progress Line Background */}
          <div className="absolute left-[59px] top-[24px] bottom-[24px] w-0.5 bg-border z-0" />
          
          {/* Active Progress Line */}
          <div ref={lineRef} className="absolute left-[59px] top-[24px] w-0.5 bg-green-500 z-10 origin-top shadow-[0_0_10px_rgba(34,197,94,0.8)]" />

          {STEPS.map((step, i) => (
            <div 
              key={step.id} 
              ref={el => { stepsRef.current[i] = el }}
              className="relative z-20 flex items-center gap-6 transition-all duration-300"
            >
              <div className="icon-bg flex shrink-0 items-center justify-center w-14 h-14 rounded-full border border-border bg-card">
                <step.icon className="size-6 text-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-mono text-muted-foreground">Step {step.id}</span>
                <span className="text-xl font-semibold">{step.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
