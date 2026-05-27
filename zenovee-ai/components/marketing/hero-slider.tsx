"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ArrowUpRight, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    eyebrow: "⚡ AI-Powered Content Engine",
    headline: "Enterprise-grade AI that transforms briefs into polished assets instantly",
    subtext: "Professional content creation at scale. Your AI workspace handles LinkedIn posts, SEO articles, sales copy, and premium brand assets with institutional-level quality.",
    cta: "Start Now",
    href: "/register",
    ctaSecondary: "Explore Features",
    hrefSecondary: "/tools",
    benefit1: "50+ Enterprise Templates",
    benefit2: "Industry-Leading AI Quality",
    benefit3: "Unlimited Professional Exports",
    color: "from-blue-600/20 via-blue-900/10 to-slate-950",
    accentColor: "bg-blue-500/20 border-blue-400/30",
    badgeColor: "bg-blue-400/15 border-blue-300/35 text-blue-100",
  },
  {
    eyebrow: "🚀 B2B Sales Acceleration",
    headline: "Close enterprise deals faster with AI-powered sales workflows",
    subtext: "Generate personalized cold email sequences, LinkedIn outreach, and sales strategies. Amplify your sales team's effectiveness with precision-engineered messaging at scale.",
    cta: "Access Sales Tools",
    href: "/tools",
    ctaSecondary: "View Pricing",
    hrefSecondary: "/pricing",
    benefit1: "Multi-channel Sequences",
    benefit2: "Objection Response Engine",
    benefit3: "Real-time Campaign Analytics",
    color: "from-emerald-600/20 via-emerald-900/10 to-slate-950",
    accentColor: "bg-emerald-500/20 border-emerald-400/30",
    badgeColor: "bg-emerald-400/15 border-emerald-300/35 text-emerald-100",
  },
  {
    eyebrow: "📈 SEO Authority Builder",
    headline: "Dominate search rankings with topical authority and strategy",
    subtext: "Create comprehensive topic clusters, interconnected content, and SEO-optimized articles. Build the authority foundation that drives consistent organic traffic.",
    cta: "Launch SEO Workspace",
    href: "/tools/seo-article-generator",
    ctaSecondary: "See Dashboard",
    hrefSecondary: "/dashboard",
    benefit1: "Semantic Keyword Clustering",
    benefit2: "Content Interconnection Maps",
    benefit3: "Rank Tracking Integration",
    color: "from-purple-600/20 via-purple-900/10 to-slate-950",
    accentColor: "bg-purple-500/20 border-purple-400/30",
    badgeColor: "bg-purple-400/15 border-purple-300/35 text-purple-100",
  },
  {
    eyebrow: "💎 Premium Brand Studio",
    headline: "Create premium brand assets that command market attention",
    subtext: "Generate professional thumbnails, social cards, product presentations, and brand materials. Maintain distinctive visual identity across all premium channels.",
    cta: "Access Brand Studio",
    href: "/tools",
    ctaSecondary: "View Portfolio",
    hrefSecondary: "/pricing",
    benefit1: "Professional Brand Templates",
    benefit2: "Multi-format Export",
    benefit3: "Brand Voice Consistency",
    color: "from-pink-600/20 via-pink-900/10 to-slate-950",
    accentColor: "bg-pink-500/20 border-pink-400/30",
    badgeColor: "bg-pink-400/15 border-pink-300/35 text-pink-100",
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
    if (!isPlaying) {
      setAutoProgress(0);
      return;
    }

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
        className={`relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br ${active.color} p-6 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm md:p-8 lg:p-12 transition-colors duration-500`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-[32px]">
          <div className={`absolute -top-40 -right-40 h-80 w-80 rounded-full opacity-20 blur-3xl pointer-events-none will-change-transform ${active.accentColor.split(' ')[0]}`} />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-slate-700/10 opacity-20 blur-3xl pointer-events-none" />
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
                <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl leading-tight">
                  {active.headline}
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-white md:text-lg">
                  {active.subtext}
                </p>
              </div>

              <div key={`cta-${index}`} className="flex flex-col sm:flex-row gap-3 pt-4 slide-in-up" style={{ animationDelay: "0.16s" }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-slate-950 hover:bg-slate-100 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
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
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold transition-all duration-300"
                >
                  <Link href={active.hrefSecondary}>{active.ctaSecondary}</Link>
                </Button>
              </div>

              <div key={`benefits-${index}`} className="flex flex-wrap gap-2 pt-2 slide-in-up" style={{ animationDelay: "0.24s" }}>
                {[active.benefit1, active.benefit2, active.benefit3].map((benefit) => (
                  <div key={benefit} className="text-xs text-white bg-white/10 border border-white/20 rounded-full px-3 py-1.5 backdrop-blur-sm font-medium">
                    ✓ {benefit}
                  </div>
                ))}
              </div>
            </div>

            <div key={`panel-${index}`} className="hero-panel-enter relative overflow-hidden rounded-[24px] border border-white/15 bg-white/5 backdrop-blur-sm p-6 md:p-8">
              <div className="relative space-y-4">
                <div className={`rounded-2xl border ${active.accentColor} bg-white/10 backdrop-blur-sm p-5 transition-all duration-300 hover:bg-white/15 hover:border-white/30`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wider text-white font-semibold">Key Capability</p>
                      <p className="mt-3 text-lg font-bold text-white">{active.eyebrow.split(" ")[1]}</p>
                      <p className="mt-2 text-sm text-white">Professional workflow</p>
                    </div>
                    <div className={`rounded-full ${active.badgeColor} px-3 py-1.5 text-xs font-bold flex-shrink-0`}>
                      PRO
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Speed", value: "90% Faster", icon: "⚡" },
                    { label: "Quality", value: "Enterprise", icon: "✨" },
                    { label: "Users", value: "10k+", icon: "👥" },
                    { label: "Uptime", value: "99.9%", icon: "🔒" },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 hover:bg-white/15 transition-all duration-300 group cursor-default">
                      <p className="text-2xl mb-2">{icon}</p>
                      <p className="text-xs uppercase tracking-wide text-white font-semibold leading-tight">{label}</p>
                      <p className="mt-2 text-base font-bold text-white group-hover:text-blue-200 transition-colors">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-5 space-y-3">
                  <p className="text-xs uppercase tracking-wide text-white font-semibold mb-3 leading-tight">Included Features</p>
                  {[active.benefit1, active.benefit2, active.benefit3].map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3 group/item">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/40 border border-emerald-400/60 text-xs font-bold text-emerald-100 group-hover/item:bg-emerald-500/50 transition-colors flex-shrink-0 mt-0.5">
                        ✓
                      </div>
                      <span className="text-sm text-white group-hover/item:text-blue-200 transition-colors leading-snug">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex gap-2 flex-1">
              {slides.map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer hover:bg-white/20 transition-colors" 
                  onClick={() => goToSlide(i)}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-white via-blue-300 to-white transition-all duration-75"
                    style={{
                      width: i === index ? `${autoProgress}%` : i < index ? "100%" : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={handlePrev}
                className="p-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 hover:border-white/40"
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 hover:border-white/40"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                onClick={handleNext}
                className="p-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 hover:border-white/40"
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </button>

              <div className="text-sm font-semibold text-white/60 ml-2 min-w-fit">
                {index + 1} / {slides.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
