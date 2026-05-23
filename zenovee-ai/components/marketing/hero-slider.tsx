"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    eyebrow: "SEO & content",
    headline: "Turn a simple brief into structured SEO content",
    subtext: "Generate organized article drafts with clearer structure, faster review, and cleaner export flow.",
    cta: "Explore SEO tools",
    href: "/tools/seo-article-generator",
    stats: [
      ["Flow", "Brief → draft → export"],
      ["Output", "Structured sections"],
      ["Speed", "Minutes, not hours"],
    ],
  },
  {
    eyebrow: "Campaign execution",
    headline: "Create ad copy and landing page messaging faster",
    subtext: "Use focused tools for paid campaigns, landing pages, and customer research without extra dashboard noise.",
    cta: "See marketing tools",
    href: "/tools",
    stats: [
      ["Channels", "Meta, Google, LinkedIn"],
      ["Tone", "Consistent across campaigns"],
      ["Use case", "Launches and growth sprints"],
    ],
  },
  {
    eyebrow: "Focused workspace",
    headline: "A calm workspace for daily marketing work",
    subtext: "Check credits, open a tool, generate an asset, and manage billing in one clear workflow.",
    cta: "View pricing",
    href: "/pricing",
    stats: [
      ["Dashboard", "Plan, credits, billing"],
      ["Access", "Quick-entry tool shortcuts"],
      ["Design", "Minimal dark SaaS UI"],
    ],
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
    <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.6)] md:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-5 transition-all duration-500">
          <div className="stat-chip border-white/15 bg-white/10 text-white">{active.eyebrow}</div>
          <div className="space-y-3">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-[2.8rem]">
              {active.headline}
            </h2>
            <p className="max-w-xl text-sm text-slate-300 md:text-base lg:text-lg">{active.subtext}</p>
          </div>
          <Button asChild size="lg" className="bg-white text-slate-950 hover:-translate-y-0.5 hover:bg-slate-100">
            <Link href={active.href}>
              {active.cta}
              <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>

        <div className="hero-panel relative overflow-hidden p-5 md:p-6">
          <div className="relative grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Now showing</p>
                  <p className="mt-2 text-lg font-semibold text-white">{active.eyebrow}</p>
                </div>
                <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Launch-ready workflow
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {active.stats.map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-white/15 bg-white/[0.08] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-200">{label}</p>
                  <p className="mt-3 text-sm font-semibold text-white md:text-base">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="grid gap-3">
                {["Clean search", "Focused tool runs", "Clear billing status"].map((item, lineIndex) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-slate-950/25 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-sm text-white">
                      0{lineIndex + 1}
                    </div>
                    <span className="text-sm text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all ${index === i ? "w-8 bg-white" : "w-2.5 bg-white/30"}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
