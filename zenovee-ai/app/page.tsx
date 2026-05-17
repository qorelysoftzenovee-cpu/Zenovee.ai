import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import Navigation from "./components/Navigation";
import { Footer } from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { createBreadcrumbSchema, createMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createMetadata({
  title: "AI tools platform for SEO, SaaS, and productivity",
  description:
    "Zenovee AI is an AI SaaS platform with SEO tools, ad copy generators, landing page workflows, persona builders, public output publishing, and programmatic discovery pages.",
  path: "/",
  keywords: ["AI tools platform", "AI SaaS", "AI productivity tools", "AI marketing tools"],
});

const features = [
  {
    title: "Clean Architecture",
    description:
      "Domain-first structure with explicit boundaries for sustainable growth.",
    icon: ShieldCheck,
  },
  {
    title: "Typed Foundation",
    description:
      "Strict TypeScript contracts across env, services, and UI primitives.",
    icon: Sparkles,
  },
  {
    title: "SaaS Ready",
    description:
      "Supabase-native data architecture with scalable route boundaries prepared for production.",
    icon: Zap,
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }])} />
      <Navigation isAuthenticated={Boolean(user)} />

      <main>
        <section className="section-shell py-16 md:py-24 lg:py-28">
          <div className="hero-glow surface-card overflow-hidden p-6 md:p-10 lg:p-12">
            <div className="grid gap-12 md:grid-cols-[1.05fr_0.95fr] md:items-center">
              <div className="space-y-6 animate-enter">
                <p className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  Production-ready AI SaaS workspace
                </p>
                <div className="space-y-4">
                  <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                    AI tools platform for <span className="text-gradient">SEO, marketing, SaaS growth</span>, and publishable outputs.
                  </h1>
                  <p className="max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
                    Zenovee combines structured AI tools, organic traffic landing pages, shareable results,
                    usage tracking, and billing-ready SaaS infrastructure into one focused platform.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href={user ? "/dashboard" : "/register"} data-analytics-event="conversion" data-analytics-label="homepage-primary-cta">
                      {user ? "Open Dashboard" : "Start Free"}
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/tools">Explore Tools</Link>
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "Fast, export-ready outputs",
                    "Secure billing and plan control",
                    "SEO and discovery built in",
                  ].map((item) => (
                    <div key={item} className="surface-muted flex items-center gap-2 px-3 py-3 text-sm text-foreground">
                      <CheckCircle2 size={16} className="text-accent" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="surface-card bg-background/65 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">What’s included</p>
                      <p className="mt-1 text-xl font-semibold tracking-tight">Everything needed for a premium AI workflow</p>
                    </div>
                    <div className="rounded-2xl border border-accent/20 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">
                      Live setup
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm">
                    {[
                      "Protected auth flow with Supabase Auth",
                      "Real credit checks and usage persistence",
                      "Admin visibility for users, revenue, and tool activity",
                      "SEO pages, blog content, and publishable public outputs",
                    ].map((item) => (
                      <div key={item} className="surface-muted flex items-start gap-3 px-4 py-3 text-foreground">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["SEO", "Scaled"],
                    ["Outputs", "Public"],
                    ["Tools", "Discoverable"],
                    ["Billing", "Ready"],
                  ].map(([label, value]) => (
                    <div key={label} className="surface-muted px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell py-4 md:py-6">
          <div className="surface-muted grid gap-4 px-5 py-4 md:grid-cols-4 md:px-6">
            {[
              ["Operational trust", "Support, refund policy, terms, and privacy routes are clearly accessible."],
              ["Smooth tool flow", "Structured generation, copy, publish, export, and reopen actions."],
              ["Production-ready billing", "Plan lifecycle visibility with live checkout and subscription actions."],
              ["Fast discovery", "SEO landing pages, categories, and comparison routes expand acquisition."],
            ].map(([title, description]) => (
              <div key={title} className="space-y-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-shell py-14 md:py-16">
          <div className="premium-grid md:grid-cols-3">
            {[
              ["Tool landing pages", "Every major AI tool has a dedicated SEO page with use cases, FAQs, examples, and CTAs."],
              ["Programmatic SEO", "Category, industry, use-case, and comparison pages expand discoverability with structured internal links."],
              ["Publishable outputs", "Users can turn generated results into public share pages with clean URLs and metadata."],
            ].map(([title, description]) => (
              <Card key={title} className="hover:-translate-y-1">
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 py-14 md:py-16">
          <div className="section-shell premium-grid md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Icon size={20} />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="section-shell py-16 md:py-20">
          <div className="surface-card overflow-hidden p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Trust-first growth</p>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Built for AI SaaS growth with SEO, tools, and public sharing.
                </h2>
                <p className="text-muted-foreground">
                  Structured routes, dynamic metadata, clean URLs, secure billing messaging, and tool-focused discovery across the platform.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/register"} data-analytics-event="conversion" data-analytics-label="homepage-bottom-cta">
                    Launch workspace
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                ["Privacy policy", "Clear privacy controls and data handling."],
                ["Terms", "Operational clarity for subscriptions and usage."],
                ["Refund policy", "Transparent expectations for paid plans."],
                ["Support contact", "Fast access to support and business help."],
              ].map(([label, text]) => (
                <div key={label} className="surface-muted px-4 py-4">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
