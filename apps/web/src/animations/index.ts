"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function useFadeIn(delay = 0, duration = 0.6) {
  const ref = useRef<any>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 20,
        duration,
        delay,
        ease: "power3.out",
      });
    }, ref);

    return () => ctx.revert();
  }, [delay, duration]);

  return ref;
}

export function useStaggerFadeIn(stagger = 0.1, delay = 0, duration = 0.6) {
  const containerRef = useRef<any>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.children, {
        opacity: 0,
        y: 20,
        duration,
        stagger,
        delay,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [stagger, delay, duration]);

  return containerRef;
}

export function useScrollReveal(delay = 0, duration = 0.6) {
  const ref = useRef<any>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        opacity: 0,
        y: 40,
        duration,
        delay,
        ease: "power3.out",
      });
    }, ref);

    return () => ctx.revert();
  }, [delay, duration]);

  return ref;
}

export function useStaggerScrollReveal(stagger = 0.1, delay = 0, duration = 0.6) {
  const containerRef = useRef<any>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.children, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        opacity: 0,
        y: 40,
        duration,
        stagger,
        delay,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [stagger, delay, duration]);

  return containerRef;
}
