"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";

// Future imports for our new GSAP sections
import { HeroSection } from "@/components/marketing/hero-section";
import { NarrativeSection } from "@/components/marketing/narrative-section";
import { DeveloperExperience } from "@/components/marketing/developer-experience";
import { ArchitectureSection } from "@/components/marketing/architecture-section";
import { HowItWorksTimeline } from "@/components/marketing/how-it-works-timeline";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { WorkflowPreview } from "@/components/marketing/workflow-preview";
import { SchedulerDemo } from "@/components/marketing/scheduler-demo";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function LandingPage() {
  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.ticker.fps(1); // minimal updates
      // Alternatively, we can use gsap.matchMedia for more robust handling
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Command className="size-5" />
            </div>
            <span className="font-bold tracking-tight">AsyncHub</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
            <Link href="#architecture" className="text-muted-foreground hover:text-foreground transition-colors">Architecture</Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Button size="sm" render={<Link href="/signup" />}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <HeroSection />
        <NarrativeSection />
        <DeveloperExperience />
        <HowItWorksTimeline />
        <DashboardPreview />
        <WorkflowPreview />
        <SchedulerDemo />
        <ArchitectureSection />
      </main>

      {/* Final CTA Footer */}
      <footer className="border-t border-border/50 bg-background pt-24 pb-12 relative overflow-hidden">
        <div className="container mx-auto max-w-screen-xl px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Ready to orchestrate millions of background jobs?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button size="lg" className="h-12 px-8 text-base bg-amber-600 hover:bg-amber-700 text-white" render={<Link href="/login" />}>
              Launch Dashboard
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" render={<Link href="/docs" />}>
              Read Documentation
            </Button>
          </div>
          
          <div className="mt-32 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Command className="size-5 text-primary" />
              <span className="font-semibold tracking-tight text-foreground">AsyncHub</span>
            </div>
            <div className="flex gap-4">
              <Link href="https://github.com/asynchub" className="hover:text-foreground transition-colors">GitHub</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
            <p>© {new Date().getFullYear()} AsyncHub Inc. All rights reserved.</p>
          </div>
        </div>
        
        {/* Subtle background flair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      </footer>
    </div>
  );
}
