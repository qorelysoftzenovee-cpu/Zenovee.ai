import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Blocks,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  LineChart,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import Navigation from "./components/Navigation";
import { Footer } from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { createBreadcrumbSchema, createMetadata } from "@/lib/seo/site";
import { toolSeoPages } from "@/lib/seo/content";
import { formatRupees, getActivePlans } from "@/lib/billing/plans";

const premiumShowcaseSlugs = new Set([
  "executive-thought-leader-ghostwriter",
  "viral-carousel-architect",
  "enterprise-objection-crusher",
  "semantic-keyword-clusterer",
  "vsl-script-architect",
  "high-end-thumbnail-designer",
  "studio-product-placer",
  "topical-authority-engine",
]);

export const metadata: Metadata = createMetadata({
  title: "Zenovee — Premium AI Workspace for Growth Teams",
  description:
    "Zenovee gives growth, SEO, sales, and brand teams a premium AI workspace to run business-grade workflows with speed, trust, and polish.",
  path: "/",
  keywords: ["AI workspace", "AI SaaS", "sales AI", "SEO AI", "premium SaaS"],
});

const trustSignals = [
  "Protected billing via verified Razorpay checkout",
  "Structured workflows for growth, SEO, sales, and brand execution",
  "Premium exports and saved outputs built for real team use",
  "Workspace-first UX instead of scattered prompting",
];

const trustPillars = [
  {
    title: "Serious execution",
    text: "Zenovee is designed for operators who need dependable output, not novelty demos.",
  },
  {
    title: "Calm product surface",
    text: "Every workflow is presented with tighter hierarchy, clearer inputs, and less decision fatigue.",
  },
  {
    title: "Business-grade confidence",
    text: "Billing, exports, and workspace structure are built to support daily use inside real teams.",
  },
];

const workflowStages = [
  {
    step: "01",
    title: "Start from a business workflow",
    text: "Open a focused system for growth, search, revenue, or brand work instead of assembling ad hoc prompts from scratch.",
  },
  {
    step: "02",
    title: "Brief with structure",
    text: "Zenovee guides your context into cleaner inputs so output quality improves before generation even begins.",
  },
  {
    step: "03",
    title: "Ship polished output",
    text: "Review, refine, export, and deploy assets that feel ready for teams, clients, and stakeholders.",
  },
];

const ecosystemGroups = [
  {
    icon: Workflow,
    title: "Authority systems",
    text: "Thought leadership, positioning, and narrative tools for executive presence.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Revenue systems",
    text: "Sales messaging, objections, and conversion workflows that preserve enterprise tone.",
  },
  {
    icon: LineChart,
    title: "Search systems",
    text: "Clusters, briefs, and topical coverage built for compounding discoverability.",
  },
  {
    icon: Blocks,
    title: "Brand systems",
    text: "Creative execution surfaces for launch assets, visual consistency, and premium presentation.",
  },
];

const businessOutcomes = [
  {
    title: "More output you can actually use",
    text: "The workspace reduces rough edges so teams spend less time repairing generic generations and more time shipping.",
  },
  {
    title: "Higher trust across teams and clients",
    text: "A calmer interface and clearer system framing make AI work easier to review, approve, and operationalize.",
  },
  {
    title: "A platform that feels ready for daily work",
    text: "Zenovee is positioned as execution software—not a collection of disconnected experiments.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const topTools = toolSeoPages.filter((tool) => premiumShowcaseSlugs.has(tool.slug)).slice(0, 6);
  const featuredPlans = getActivePlans().slice(0, 3);

  const heroPrimaryHref = user ? "/dashboard" : "/register";
  const heroPrimaryLabel = user ? "Open workspace" : "Create workspace";

  return (
    <div className="min-h-screen landing-dark text-slate-900">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }])} />
      <Navigation isAuthenticated={Boolean(user)} isAdmin={user?.role === "admin"} />

      <main className="overflow-hidden pb-8 md:pb-12">
        <section className="section-shell relative pt-8 md:pt-10 lg:pt-12">
          <div className="premium-grid premium-spotlight absolute inset-x-4 top-3 -z-10 h-[78%] rounded-[40px] opacity-70 md:inset-x-6 lg:inset-x-8" />
          <div className="section-surface overflow-hidden px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:items-end">
              <div className="space-y-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/78 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                  <Sparkles className="size-3.5 text-primary" />
                  AI execution workspace for serious teams
                </div>

                <div className="max-w-4xl space-y-4">
                  <h1 className="max-w-4xl text-balance text-[2.8rem] font-semibold tracking-[-0.06em] text-slate-950 md:text-6xl lg:text-[4.7rem]">
                    Zenovee turns AI work into a premium operating system for execution.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-xl">
                    Built for growth, SEO, sales, and brand teams that need sharper workflow structure, calmer product design, and output they can trust in front of stakeholders.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button asChild size="lg" className="min-w-[190px]">
                    <Link href={heroPrimaryHref}>
                      {heroPrimaryLabel}
                      <ArrowRight size={18} />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="min-w-[170px] border-slate-300 bg-white/75 text-slate-900 hover:bg-white"
                  >
                    <Link href="/pricing">View pricing</Link>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {trustSignals.map((signal) => (
                    <div key={signal} className="flex items-start gap-3 rounded-[24px] border border-white/70 bg-white/74 px-4 py-4 shadow-[0_20px_48px_-38px_rgba(15,23,42,0.28)] backdrop-blur-xl">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <p className="text-sm leading-6 text-slate-700">{signal}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 -translate-y-4 translate-x-4 rounded-[34px] bg-gradient-to-br from-primary/10 via-white/30 to-sky-100/50 blur-2xl" />
                <div className="relative rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-4 shadow-[0_38px_90px_-48px_rgba(15,23,42,0.38)] backdrop-blur-xl md:p-5">
                  <div className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:p-6">
                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Zenovee workspace</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">One system for premium AI execution</h2>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                        Stable workflow
                      </div>
                    </div>

                    <div className="grid gap-4 pt-5">
                      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Active workflow</p>
                              <p className="mt-2 text-lg font-semibold text-white">Executive authority narrative</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                              Ready to export
                            </div>
                          </div>

                          <div className="mt-5 space-y-3">
                            {[
                              "Audience and positioning aligned",
                              "Narrative structure clarified",
                              "Output framed for deployment",
                            ].map((item) => (
                              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/10 px-3 py-3 text-sm text-slate-200">
                                <div className="size-2 rounded-full bg-sky-300" />
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Execution qualities</p>
                          <div className="mt-4 space-y-3">
                            {[
                              ["Calm UX", "Less noise around every task"],
                              ["Premium output", "Designed to feel stakeholder-ready"],
                              ["Trusted billing", "Verified checkout and synchronized state"],
                            ].map(([title, text]) => (
                              <div key={title} className="rounded-2xl border border-white/8 bg-black/10 p-3">
                                <p className="text-sm font-semibold text-white">{title}</p>
                                <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          { label: "Workflow-first", value: "Structured entry points" },
                          { label: "Business-ready", value: "Cleaner deliverables" },
                          { label: "Daily-use trust", value: "Platform polish" },
                        ].map((item) => (
                          <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                            <p className="mt-2 text-base font-semibold text-white">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell pt-6 md:pt-8 lg:pt-10">
          <div className="rounded-[30px] border border-white/65 bg-white/72 px-5 py-5 shadow-[0_26px_60px_-42px_rgba(15,23,42,0.2)] backdrop-blur-xl md:px-8 md:py-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="premium-label">Trust and product posture</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                  Designed to feel intentional from first impression to final output
                </h2>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="stat-chip">Protected payments</span>
                <span className="stat-chip">Structured workflows</span>
                <span className="stat-chip">Premium exports</span>
                <span className="stat-chip">Workspace-first UX</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {trustPillars.map((pillar) => (
                <div key={pillar.title} className="rounded-[26px] border border-slate-200/80 bg-white/82 p-5 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.22)]">
                  <p className="text-lg font-semibold text-slate-950">{pillar.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">{pillar.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell pt-8 md:pt-10 lg:pt-12">
          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="section-surface p-6 md:p-8 lg:sticky lg:top-24">
              <p className="premium-label">Core workflow showcase</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                A clean progression from brief to business-ready output
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
                Instead of a carousel or clipped cards, Zenovee presents one coherent operating model. Every stage reduces chaos and increases confidence.
              </p>
            </div>

            <div className="space-y-4">
              {workflowStages.map((stage) => (
                <Card key={stage.step} className="overflow-hidden rounded-[28px] border-white/70 bg-white/88 shadow-[0_24px_54px_-40px_rgba(15,23,42,0.2)]">
                  <CardContent className="grid gap-5 p-6 md:grid-cols-[88px_minmax(0,1fr)] md:p-7">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-950 text-lg font-semibold tracking-[0.2em] text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.45)]">
                      {stage.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950">{stage.title}</h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{stage.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell pt-8 md:pt-10 lg:pt-12">
          <div className="section-surface p-6 md:p-8 lg:p-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="premium-label">Tool ecosystem</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  A curated AI ecosystem organized around real execution domains
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                Zenovee avoids the generic SaaS gallery feel by grouping capabilities into focused systems with clearer business intent.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {ecosystemGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.title} className="rounded-[26px] border border-white/70 bg-white/86 p-5 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.18)]">
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-950">{group.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{group.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {topTools.map((tool) => (
                <Card key={tool.slug} className="group overflow-hidden rounded-[28px] border-white/70 bg-white/90 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-38px_rgba(15,23,42,0.24)]">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Premium workflow
                      </span>
                      <Bot className="size-4 text-slate-400" />
                    </div>
                    <div>
                      <CardTitle className="line-clamp-2 text-slate-950">{tool.name}</CardTitle>
                      <CardDescription className="mt-3 line-clamp-3 text-slate-600">
                        {tool.heroDescription}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                      Built as a clearer workflow surface with structured context and more deployable output.
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link href={user ? "/dashboard/tools" : "/register"}>Explore workflow</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell pt-8 md:pt-10 lg:pt-12">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="section-surface p-6 md:p-8">
              <p className="premium-label">Business outcomes</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                The value is operational clarity, not just generation volume
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
                Zenovee is positioned to help teams work faster with less noise, stronger trust signals, and better readiness across every AI-driven task.
              </p>

              <div className="premium-glass mt-6 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Operational trust built into the experience</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Secure billing, clearer workflow framing, and structured outputs create a product surface teams can return to daily.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {businessOutcomes.map((outcome) => (
                <div key={outcome.title} className="rounded-[28px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.18)]">
                  <h3 className="text-xl font-semibold text-slate-950">{outcome.title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{outcome.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell pt-8 md:pt-10 lg:pt-12">
          <div className="section-surface p-6 md:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div className="space-y-4">
                <p className="premium-label">Pricing</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  Clear plans for teams that care about premium execution
                </h2>
                <p className="text-base leading-7 text-slate-600 md:text-lg">
                  Straightforward monthly plans, predictable credits, and secure checkout—framed to feel trustworthy, not salesy.
                </p>
                <div className="rounded-[26px] border border-slate-200 bg-white/82 p-5 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.16)]">
                  <div className="flex items-start gap-3">
                    <Zap className="mt-0.5 size-5 text-primary" />
                    <div>
                      <p className="font-semibold text-slate-900">No surprise positioning</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Pricing stays simple so the product can sell itself through clarity, trust, and stronger workflow design.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {featuredPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`overflow-hidden rounded-[28px] border-white/70 bg-white/90 ${
                      plan.premiumLabel
                        ? "ring-1 ring-primary/20 shadow-[0_28px_60px_-36px_rgba(79,70,229,0.24)]"
                        : "shadow-[0_22px_48px_-38px_rgba(15,23,42,0.18)]"
                    }`}
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base text-slate-950 md:text-lg">{plan.displayName}</CardTitle>
                        {plan.premiumLabel ? (
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                            {plan.premiumLabel}
                          </span>
                        ) : null}
                      </div>
                      <CardDescription className="text-slate-600">
                        {plan.credits.toLocaleString()} credits each month
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-semibold tracking-tight text-slate-950">
                          {formatRupees(plan.monthlyPriceRupees)}
                          <span className="ml-1 text-sm font-medium text-slate-500">/mo</span>
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{plan.premiumPositioning}</p>
                      </div>
                      <Button
                        asChild
                        variant={plan.premiumLabel ? "default" : "outline"}
                        className="w-full border-slate-300 bg-white/80 text-slate-900 hover:bg-white"
                      >
                        <Link href={user ? "/billing" : "/register"}>{plan.premiumLabel ? "Choose premium" : "Choose plan"}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell pt-8 md:pt-10 lg:pt-12">
          <div className="section-surface premium-spotlight overflow-hidden p-8 md:p-10 lg:p-12">
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                  <Sparkles className="size-3.5 text-primary" />
                  Launch-ready platform presence
                </div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
                  If your team needs AI that feels trustworthy, modern, and operationally ready, start with Zenovee.
                </h2>
                <p className="text-base leading-7 text-slate-600 md:text-lg">
                  Move from scattered tools and generic prompts to a calm execution workspace designed to support real business outcomes.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:min-w-[220px]">
                <Button asChild size="lg">
                  <Link href={heroPrimaryHref}>
                    {heroPrimaryLabel}
                    <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-slate-300 bg-white/75 text-slate-900 hover:bg-white">
                  <Link href="/tools">Browse workflows</Link>
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
