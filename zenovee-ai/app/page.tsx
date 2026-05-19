import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import Navigation from "./components/Navigation";
import { Footer } from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { createBreadcrumbSchema, createMetadata } from "@/lib/seo/site";
import { HeroSlider } from "@/components/marketing/hero-slider";
import { toolSeoPages } from "@/lib/seo/content";
import { subscriptionPlans } from "@/app/subscription-plans";

export const metadata: Metadata = createMetadata({
  title: "Premium AI tools for focused marketing and growth work",
  description:
    "Zenovee AI gives founders and marketers a premium workspace for SEO, messaging, landing page copy, and campaign execution.",
  path: "/",
  keywords: ["AI tools platform", "AI SaaS", "AI productivity tools", "AI marketing tools"],
});

const testimonials = [
  {
    quote: "Zenovee feels closer to a polished product than a prompt playground. The workflows stay focused and the outputs are easy to act on.",
    author: "Aarav Mehta",
    role: "Growth lead",
  },
  {
    quote: "The clean UI makes it easier to move from SEO research to usable copy without bouncing between too many screens.",
    author: "Naina Kapoor",
    role: "Content strategist",
  },
  {
    quote: "It’s one of the few AI dashboards that feels calm. Credits, billing, and recent runs are exactly where I expect them to be.",
    author: "Rohan Sethi",
    role: "Startup founder",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const topTools = toolSeoPages.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }])} />
      <Navigation isAuthenticated={Boolean(user)} isAdmin={user?.role === "admin"} />

      <main>
        <section className="section-shell py-16 md:py-20 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="premium-label">Premium AI SaaS</div>
              <div className="space-y-4">
                <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                  A cleaner way to run <span className="text-gradient">SEO, content, and growth workflows</span> with AI.
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                  Zenovee gives teams a focused workspace for strategy, copy, and execution—without the clutter of a generic dashboard template.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/register"} data-analytics-event="conversion" data-analytics-label="homepage-primary-cta">
                    {user ? "Open dashboard" : "Start with Zenovee"}
                    <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/tools">Browse tools</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  "Focused dashboard",
                  "Clean tool discovery",
                  "Structured outputs",
                ].map((item) => (
                  <span key={item} className="stat-chip">{item}</span>
                ))}
              </div>
            </div>

            <div className="hero-panel hero-glow overflow-hidden p-6 md:p-8">
              <div className="grid gap-4">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Why it feels better</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Minimal UX", "Less noise, clearer actions"],
                      ["Premium visuals", "Depth, contrast, and motion"],
                      ["Real utility", "Tools built around actual workflows"],
                      ["Fast orientation", "Plan, credits, and runs at a glance"],
                    ].map(([label, text]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                        <p className="text-sm font-medium text-white">{label}</p>
                        <p className="mt-2 text-sm text-slate-300">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["3", "Core workflows"],
                    ["1", "Clean dashboard"],
                    ["0", "Template noise"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                      <p className="text-2xl font-semibold text-white">{value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell pb-8 md:pb-10">
          <HeroSlider />
        </section>

        <section className="section-shell py-14 md:py-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="premium-label">Top tools</div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">A smaller set of tools with stronger clarity</h2>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Each tool is built to be easy to scan, quick to open, and practical for real marketing and growth work.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/tools">View all tools</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {topTools.map((tool) => (
              <Card key={tool.slug} className="interactive-card border-white/10">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{tool.icon}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {tool.category}
                    </span>
                  </div>
                  <div>
                    <CardTitle>{tool.name}</CardTitle>
                    <CardDescription className="mt-2">{tool.heroDescription}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">{tool.primaryKeyword}</span>
                  <Button asChild>
                    <Link href={`/tools/${tool.slug}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell py-14 md:py-16">
          <div className="mb-8 space-y-2">
            <div className="premium-label">Pricing preview</div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Simple plans built around credits</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className={`interactive-card border-white/10 ${plan.id === "growth" ? "bg-white/[0.05]" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.id === "growth" ? (
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-accent">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <CardDescription>{plan.credits.toLocaleString()} credits per month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-3xl font-semibold tracking-tight">
                    ₹{plan.price.toLocaleString("en-IN")}
                    <span className="ml-1 text-base font-normal text-muted-foreground">/month</span>
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <Button asChild variant="secondary">
              <Link href="/pricing">View full pricing</Link>
            </Button>
          </div>
        </section>

        <section className="section-shell py-16 md:py-20">
          <div className="mb-8 space-y-2">
            <div className="premium-label">Social proof</div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">A more polished experience for serious users</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} className="interactive-card border-white/10">
                <CardHeader>
                  <div className="mb-3 flex items-center gap-1 text-amber-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <CardDescription className="text-base leading-7 text-foreground/90">
                    “{testimonial.quote}”
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell pb-16 md:pb-20">
          <div className="hero-glow hero-panel overflow-hidden p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-3">
                <div className="stat-chip border-white/10 bg-white/6 text-slate-200">
                  <Sparkles size={14} /> Launch-ready frontend
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Ready to use Zenovee with a cleaner, premium interface?
                </h2>
                <p className="text-sm text-slate-300 md:text-base">
                  Start with focused tools, clear pricing, and a dashboard that helps users act quickly.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-slate-100">
                  <Link href={user ? "/dashboard" : "/register"} data-analytics-event="conversion" data-analytics-label="homepage-bottom-cta">
                    {user ? "Open dashboard" : "Create your account"}
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="border-white/15 bg-white/8 text-white hover:bg-white/12">
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
