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
    <div className="overflow-hidden rounded-3xl border border-slate-800/60 bg-[#0B1020] p-6 text-slate-100 shadow-2xl md:p-10">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-4 transition-all duration-500">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">{active.headline}</h1>
          <p className="text-slate-300 md:text-lg">{active.subtext}</p>
          <Button asChild size="lg" className="bg-primary-gradient text-white hover:opacity-95">
            <Link href={active.href}>{active.cta}</Link>
          </Button>
        </div>
        <div className="h-56 rounded-2xl bg-gradient-to-br from-indigo-500/30 via-violet-500/25 to-slate-900 p-6 transition-all duration-500 md:h-72">
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-600/60 bg-slate-900/50">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80"
              alt="AI workflow preview"
              className="h-full w-full rounded-xl object-cover opacity-90"
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all ${index === i ? "w-7 bg-violet-400" : "w-2.5 bg-slate-500/50"}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
