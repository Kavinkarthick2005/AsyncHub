"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Activity, Server, Database, TrendingUp, AlertTriangle, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const INITIAL_HEIGHTS = [
  35, 60, 45, 80, 20, 50, 75, 40, 90, 30,
  65, 55, 85, 25, 70, 45, 35, 60, 45, 80,
  20, 50, 75, 40, 90, 30, 65, 55, 85, 25,
  70, 45, 35, 60, 45, 80, 20, 50, 75, 40
];

export function DashboardPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Chart refs
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Stats refs
  const throughputRef = useRef<HTMLSpanElement>(null);
  const queueDepthRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      // Entrance animation
      gsap.from(".dash-widget", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        }
      });

      // Animate Chart Bars infinitely
      barsRef.current.forEach(bar => {
        if (!bar) return;
        const originalHeight = bar.style.height;
        gsap.to(bar, {
          height: () => `${Math.random() * 80 + 20}%`,
          duration: () => Math.random() * 1.5 + 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });

      // Animate Counters
      if (throughputRef.current) {
        gsap.to(throughputRef.current, {
          innerText: 14500,
          duration: 3,
          snap: { innerText: 1 },
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%"
          }
        });
      }

      // Simulate a queue spike and drain
      if (queueDepthRef.current) {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        tl.to(queueDepthRef.current, { innerText: 4200, duration: 1, snap: { innerText: 1 }, ease: "power2.out" })
          .to(queueDepthRef.current, { innerText: 12, duration: 3, snap: { innerText: 1 }, ease: "power2.in" });
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 bg-muted/10 border-t border-border/50">
      <div className="container mx-auto max-w-screen-xl px-4">
        
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 mb-6 text-purple-500">
            <LayoutDashboard className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Observability</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See everything.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Monitor your entire distributed system in real-time. Native dashboards give you instant insight into throughput, worker health, and queue depth.
          </p>
        </div>

        {/* Dashboard Grid Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Throughput Chart */}
          <Card className="dash-widget lg:col-span-2 shadow-xl border-primary/20 bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Jobs Processed (24h)
                <TrendingUp className="size-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">
                <span ref={throughputRef}>0</span> <span className="text-sm text-muted-foreground font-normal">jobs/sec</span>
              </div>
              <div className="h-32 flex items-end gap-1 w-full border-b border-border">
                {INITIAL_HEIGHTS.map((height, i) => (
                  <div 
                    key={i} 
                    ref={el => { barsRef.current[i] = el }}
                    className="flex-1 bg-primary/40 rounded-t-sm transition-all"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workers Health */}
          <Card className="dash-widget shadow-xl border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Worker Fleet
                <Server className="size-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">42 <span className="text-sm text-muted-foreground font-normal">nodes online</span></div>
              <div className="space-y-3">
                {[
                  { name: "worker-us-east-1a", cpu: "42%", mem: "1.2GB" },
                  { name: "worker-us-east-1b", cpu: "38%", mem: "1.1GB" },
                  { name: "worker-eu-west-1a", cpu: "51%", mem: "1.4GB" }
                ].map((w, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-mono text-muted-foreground">{w.name}</span>
                    </div>
                    <div className="flex gap-3 font-mono">
                      <span>{w.cpu}</span>
                      <span>{w.mem}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Queue Depth */}
          <Card className="dash-widget shadow-xl border-amber-500/20 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Queue Depth (critical)
                <Database className="size-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500 mb-2">
                <span ref={queueDepthRef}>0</span>
              </div>
              <p className="text-xs text-muted-foreground">Jobs waiting for a worker</p>
            </CardContent>
          </Card>

          {/* Latest Failures */}
          <Card className="dash-widget lg:col-span-2 shadow-xl border-destructive/20 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Latest Failures
                <AlertTriangle className="size-4 text-destructive" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2">
                {[
                  { job: "job_a1b2", queue: "webhooks", err: "Timeout after 30000ms" },
                  { job: "job_c3d4", queue: "emails", err: "SMTP Connection Refused" },
                ].map((f, i) => (
                  <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs p-2 rounded bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">{f.job}</span>
                      <span className="px-1.5 py-0.5 rounded bg-muted font-mono">{f.queue}</span>
                    </div>
                    <span className="text-destructive font-mono truncate mt-1 sm:mt-0">{f.err}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  );
}
