"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    headline: "Replace expensive marketing work with AI",
    subtext: "Generate ads, SEO content, landing pages, and campaigns faster.",
    cta: "View Pricing",
    href: "/pricing",
  },
  {
    headline: "Create better content in minutes",
    subtext: "Turn ideas into structured, ready-to-use marketing assets.",
    cta: "Start Creating",
    href: "/tools",
  },
  {
    headline: "Build product pages that convert",
    subtext: "Generate landing page copy, CTAs, FAQs, and sales sections.",
    cta: "Explore Tools",
    href: "/tools",
  },
  {
    headline: "Grow SEO traffic with AI",
    subtext: "Create outlines, articles, meta descriptions, and content clusters.",
    cta: "Use SEO Tools",
    href: "/tools",
  },
  {
    headline: "One platform for serious AI workflows",
    subtext: "A paid AI toolkit built for founders, marketers, and businesses.",
    cta: "Choose Plan",
    href: "/pricing",
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const active = slides[index];

  return (
    <div className="surface-card overflow-hidden p-6 md:p-10">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-4 transition-all duration-500">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{active.headline}</h1>
          <p className="text-muted-foreground md:text-lg">{active.subtext}</p>
          <Button asChild size="lg">
            <Link href={active.href}>{active.cta}</Link>
          </Button>
        </div>
        <div className="h-56 rounded-2xl bg-gradient-to-br from-accent/20 via-background to-muted p-6 transition-all duration-500 md:h-72">
          <div className="h-full w-full rounded-xl border border-border/60 bg-background/70" />
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all ${index === i ? "w-7 bg-accent" : "w-2.5 bg-muted-foreground/40"}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
