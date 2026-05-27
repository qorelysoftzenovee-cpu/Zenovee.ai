"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ArrowUpRight, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    eyebrow: "Executive workspace",
    headline: "A calmer AI surface for brand, growth, and content execution",
    subtext: "Move from scattered prompt tabs to a structured workspace that turns briefs into clean, deployable output with premium UX around every step.",
    cta: "Start now",
    href: "/register",
    ctaSecondary: "Explore tools",
    hrefSecondary: "/tools",
    benefit1: "Focused workflow entry points",
    benefit2: "Clean premium hierarchy",
    benefit3: "Business-ready output",
    color: "from-white via-slate-50 to-blue-50",
    accentColor: "bg-blue-500/20 border-blue-200/40",
    badgeColor: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    eyebrow: "Revenue systems",
    headline: "Sharpen outbound and conversion workflows without losing tone or trust",
    subtext: "Use premium sales workflows to structure sequences, objections, and messaging systems for serious B2B execution.",
    cta: "Access sales tools",
    href: "/tools",
    ctaSecondary: "View pricing",
    hrefSecondary: "/pricing",
    benefit1: "ICP-aware messaging",
    benefit2: "Enterprise objection flows",
    benefit3: "Faster campaign readiness",
    color: "from-white via-emerald-50/60 to-cyan-50",
    accentColor: "bg-emerald-500/20 border-emerald-200/40",
    badgeColor: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  {
    eyebrow: "Search authority",
    headline: "Turn SEO work into a system of briefs, clusters, and authority maps",
    subtext: "Zenovee helps teams structure search strategy with better clarity, stronger discoverability, and fewer disconnected content tasks.",
    cta: "Launch SEO workspace",
    href: "/tools/seo-article-generator",
    ctaSecondary: "See dashboard",
    hrefSecondary: "/dashboard",
    benefit1: "Topic architecture",
    benefit2: "Search-ready organization",
    benefit3: "Compounding authority",
    color: "from-white via-violet-50/60 to-fuchsia-50",
    accentColor: "bg-violet-500/20 border-violet-200/40",
    badgeColor: "bg-violet-50 border-violet-200 text-violet-700",
  },
  {
    eyebrow: "Brand systems",
    headline: "Create higher-trust brand assets with a more refined creative workflow",
    subtext: "Support launches, social assets, and premium visual execution with tools organized around consistency—not just generation volume.",
    cta: "Access brand studio",
    href: "/tools",
    ctaSecondary: "View pricing",
    hrefSecondary: "/pricing",
    benefit1: "Cleaner asset direction",
    benefit2: "Premium previews",
    benefit3: "Consistent brand execution",
    color: "from-white via-rose-50/60 to-orange-50",
    accentColor: "bg-rose-500/20 border-rose-200/40",
    badgeColor: "bg-rose-50 border-rose-200 text-rose-700",
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoProgress, setAutoProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const handleAutoSlide = () => {
      setIndex((prev) => (prev + 1) % slides.length);
    };

    timerRef.current = setInterval(handleAutoSlide, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    let rafId: number;
    const startTime = Date.now();
    const duration = 6000;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setAutoProgress(progress);

      if (progress < 100) {
        rafId = requestAnimationFrame(updateProgress);
      }
    };

    rafId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, index]);

  const displayedProgress = isPlaying ? autoProgress : 0;

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (i: number) => {
    setIndex(i);
  };

  const active = slides[index];

  return (
    <div className="w-full">
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .slide-in-up {
          animation: slideInUp 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          will-change: transform, opacity;
        }
        .slide-in-right {
          animation: slideInRight 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          will-change: transform, opacity;
        }
        .hero-panel-enter {
          animation: slideInRight 0.7s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }
      `}</style>

      <div 
        className={`relative overflow-hidden rounded-[36px] border border-white/70 bg-gradient-to-br ${active.color} p-6 shadow-[0_32px_80px_-42px_rgba(15,23,42,0.28)] backdrop-blur-sm md:p-8 lg:p-10 transition-colors duration-500`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-[32px]">
          <div className={`absolute -top-28 -right-24 h-72 w-72 rounded-full opacity-70 blur-3xl pointer-events-none will-change-transform ${active.accentColor.split(' ')[0]}`} />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white opacity-70 blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-6">
              <div key={`eyebrow-${index}`} className="slide-in-up">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${active.badgeColor} backdrop-blur-sm`}>
                  <span className="text-xs font-semibold uppercase tracking-wider">{active.eyebrow}</span>
                </div>
              </div>

              <div key={`headline-${index}`} className="space-y-4 slide-in-up" style={{ animationDelay: "0.08s" }}>
                 <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl lg:text-5xl leading-tight">
                  {active.headline}
                </h2>
                 <p className="max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                  {active.subtext}
                </p>
              </div>

              <div key={`cta-${index}`} className="flex flex-col sm:flex-row gap-3 pt-4 slide-in-up" style={{ animationDelay: "0.16s" }}>
                <Button
                  asChild
                  size="lg"
                   className="bg-slate-950 text-white hover:bg-slate-800 shadow-[0_20px_40px_-22px_rgba(15,23,42,0.45)] group"
                >
                  <Link href={active.href}>
                    {active.cta}
                    <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                   className="border-slate-300 bg-white/70 text-slate-900 hover:bg-white font-semibold transition-all duration-300"
                >
                  <Link href={active.hrefSecondary}>{active.ctaSecondary}</Link>
                </Button>
              </div>

              <div key={`benefits-${index}`} className="flex flex-wrap gap-2 pt-2 slide-in-up" style={{ animationDelay: "0.24s" }}>
                {[active.benefit1, active.benefit2, active.benefit3].map((benefit) => (
                  <div key={benefit} className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-sm">
                    ✓ {benefit}
                  </div>
                ))}
              </div>
            </div>

            <div key={`panel-${index}`} className="hero-panel-enter relative overflow-hidden rounded-[28px] border border-white/80 bg-white/76 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.24)] backdrop-blur-xl md:p-8">
              <div className="relative space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)]">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Workspace snapshot</p>
                  <h3 className="mt-3 text-2xl font-semibold text-slate-950">A better surface for premium AI execution</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">The goal is clarity: better hierarchy, calmer layout, and workflow presentation that feels trustworthy enough for daily business use.</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Workflow UX</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">Cleaner</p>
                      <p className="mt-1 text-sm text-slate-500">Less noise, stronger trust signals</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Team readiness</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">Higher</p>
                      <p className="mt-1 text-sm text-slate-500">More deployable output, fewer rough edges</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5 backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      ✦
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">“This feels more like a premium workspace than a bundle of AI tools.”</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">— Internal product benchmark</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Premium", value: "Calm UX" },
                    { label: "Trusted", value: "Secure billing" },
                    { label: "Structured", value: "Workflow-first" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/85 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200">
            <div className="flex gap-2 flex-1">
              {slides.map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden cursor-pointer hover:bg-slate-300 transition-colors" 
                  onClick={() => goToSlide(i)}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900 transition-all duration-75"
                    style={{
                      width: i === index ? `${displayedProgress}%` : i < index ? "100%" : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={handlePrev}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50"
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                onClick={handleNext}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50"
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </button>

              <div className="ml-2 min-w-fit text-sm font-semibold text-slate-500">
                {index + 1} / {slides.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
