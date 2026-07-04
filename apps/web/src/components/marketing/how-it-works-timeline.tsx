"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Code, Database, Server, Cog, RotateCcw, CheckCircle, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

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
      // Pin the section
      const totalScroll = 3000; // pixels to scroll through the whole timeline

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: `+=${totalScroll}`,
        pin: pinRef.current,
        scrub: 1,
      });

      // Animate the progress line height
      gsap.fromTo(lineRef.current,
        { height: "0%" },
        {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: `+=${totalScroll}`,
            scrub: 0.5,
          }
        }
      );

      // Animate each step becoming active based on scroll position
      stepsRef.current.forEach((step, i) => {
        if (!step) return;
        const startOffset = (i / STEPS.length) * totalScroll;
        const endOffset = ((i + 1) / STEPS.length) * totalScroll;

        // Animate opacity and scale when step becomes active
        gsap.to(step, {
          opacity: 1,
          scale: 1.05,
          color: "white",
          scrollTrigger: {
            trigger: containerRef.current,
            start: `top+=${startOffset} top`,
            end: `top+=${endOffset} top`,
            scrub: 0.5,
            toggleClass: { targets: step, className: "active-step" }
          }
        });
        
        // Scale down icon background when active
        gsap.to(step.querySelector('.icon-bg'), {
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          borderColor: "rgba(34, 197, 94, 0.5)",
          scrollTrigger: {
             trigger: containerRef.current,
             start: `top+=${startOffset} top`,
             end: `top+=${endOffset} top`,
             scrub: 0.5,
          }
        });
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="how-it-works" className="relative bg-background border-t border-border/50">
      {/* The scrollable space */}
      <div className="h-[400vh]" />
      
      {/* The pinned container */}
      <div ref={pinRef} className="absolute top-0 left-0 w-full h-screen flex flex-col items-center justify-center pointer-events-none">
        
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How AsyncHub Works</h2>
          <p className="mt-4 text-lg text-muted-foreground">The lifecycle of a background job</p>
        </div>

        <div className="relative flex flex-col gap-8 w-full max-w-lg px-8">
          
          {/* Progress Line Background */}
          <div className="absolute left-[59px] top-[24px] bottom-[24px] w-0.5 bg-border z-0" />
          
          {/* Active Progress Line */}
          <div ref={lineRef} className="absolute left-[59px] top-[24px] w-0.5 bg-green-500 z-10 origin-top shadow-[0_0_10px_rgba(34,197,94,0.8)]" />

          {STEPS.map((step, i) => (
            <div 
              key={step.id} 
              ref={el => { stepsRef.current[i] = el }}
              className="relative z-20 flex items-center gap-6 opacity-30 scale-95 transition-all duration-300 transform-gpu"
            >
              <div className="icon-bg flex shrink-0 items-center justify-center w-14 h-14 rounded-full border border-border bg-card transition-colors duration-300">
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
