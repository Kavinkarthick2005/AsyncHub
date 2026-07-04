"use client";

import Link from "next/link";
import { ArrowRight, Command, Server, Shield, Zap, GitBranch, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFadeIn, useStaggerFadeIn } from "@/animations";

export default function LandingPage() {
  const heroRef = useStaggerFadeIn(0.1, 0, 0.8);
  const overviewRef = useFadeIn(0.2);
  const buttonsRef = useStaggerFadeIn(0.1, 0.2);
  const capabilitiesRef = useStaggerFadeIn(0.1, 0.4);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
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
            <Link href="#overview" className="text-muted-foreground hover:text-foreground transition-colors">Overview</Link>
            <Link href="#capabilities" className="text-muted-foreground hover:text-foreground transition-colors">Capabilities</Link>
            <Link href="#architecture" className="text-muted-foreground hover:text-foreground transition-colors">Architecture</Link>
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
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-24 md:pt-48 md:pb-32">
          <div className="container mx-auto max-w-screen-xl px-4 text-center" ref={heroRef}>
            <div className="mx-auto flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-border bg-muted/50 px-7 py-2 backdrop-blur transition-all hover:bg-muted/80">
              <span className="text-sm font-medium">Introducing AsyncHub v1.0</span>
            </div>
            <h1 className="mt-8 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Reliable distributed <br className="hidden sm:block" />
              <span className="text-muted-foreground">job orchestration.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Enterprise-grade background job processing, workflow orchestration, and scheduling for modern development teams.
            </p>
            <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center mt-8 opacity-0" ref={buttonsRef}>
              <Button size="lg" className="h-12 px-8 text-base" render={<Link href="/signup" />}>
                Start Building Free
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" render={<Link href="/docs" />}>
                Read the Docs
              </Button>
            </div>
          </div>
        </section>

        {/* Platform Overview */}
        <section id="overview" className="border-t border-border/50 py-24 bg-muted/20">
          <div className="container mx-auto max-w-screen-xl px-4" ref={overviewRef}>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for precision and scale.</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Stop managing infrastructure. Start building features. AsyncHub provides the tools to manage millions of background jobs with zero operational overhead.
              </p>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section id="capabilities" className="py-24">
          <div className="container mx-auto max-w-screen-xl px-4">
            <div className="mb-16">
              <h2 className="text-3xl font-bold tracking-tight">Core Capabilities</h2>
              <p className="mt-2 text-muted-foreground">Everything you need to orchestrate complex background workloads.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" ref={capabilitiesRef}>
              {[
                {
                  icon: Server,
                  title: "Distributed Workers",
                  description: "Scale your worker nodes infinitely across regions with native load balancing and auto-scaling.",
                },
                {
                  icon: GitBranch,
                  title: "Complex Workflows",
                  description: "Define DAGs for dependent jobs. Handle parallel execution, retries, and conditional branches effortlessly.",
                },
                {
                  icon: Activity,
                  title: "Real-time Observability",
                  description: "Monitor job execution, latency, and throughput in real-time with granular metrics and logging.",
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  description: "SOC2 compliant infrastructure with role-based access control, audit logs, and encrypted payloads.",
                },
                {
                  icon: Zap,
                  title: "Low Latency",
                  description: "Optimized for sub-millisecond dispatch times ensuring high-priority jobs execute immediately.",
                },
                {
                  icon: Command,
                  title: "Developer First",
                  description: "Type-safe SDKs, comprehensive CLI, and REST APIs designed for modern development workflows.",
                },
              ].map((feature, i) => (
                <div key={i} className="group rounded-2xl border border-border/50 bg-card p-8 transition-colors hover:border-primary/50">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background py-12">
        <div className="container mx-auto max-w-screen-xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Command className="size-5 text-primary" />
            <span className="font-semibold tracking-tight">AsyncHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AsyncHub Inc. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
