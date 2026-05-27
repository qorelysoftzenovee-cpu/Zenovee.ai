import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import Navigation from "./components/Navigation";
import { Footer } from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { createBreadcrumbSchema, createMetadata } from "@/lib/seo/site";
import { toolSeoPages } from "@/lib/seo/content";
import { getActivePlans, formatRupees } from "@/lib/billing/plans";
import { HeroSlider } from "@/components/marketing/hero-slider";

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

const trustPillars = [
  { label: "Protected billing", value: "Razorpay-verified checkout" },
  { label: "Business-grade workflows", value: "Built for growth, sales, SEO, and brand teams" },
  { label: "Clean execution", value: "Structured outputs with premium exports" },
];

const premiumWorkflows = [
  {
    title: "Executive positioning",
    description:
      "Shape high-trust authority content, thought leadership, and strategic narratives for founders and operators.",
    points: ["LinkedIn authority systems", "Thought leadership", "High-trust positioning"],
  },
  {
    title: "Revenue acceleration",
    description:
      "Launch outbound and conversion messaging with sharper ICP alignment, objections, and enterprise tone.",
    points: ["Sales sequences", "Objection handling", "Conversion messaging"],
  },
  {
    title: "Search authority",
    description:
      "Move from isolated content tasks to structured organic growth systems with topical coverage and clusters.",
    points: ["Topic clustering", "Authority maps", "Search-ready briefs"],
  },
];

const operatingModel = [
  {
    title: "Choose your workflow",
    text: "Start inside a dedicated growth, SEO, sales, or brand workflow instead of stitching together generic prompts.",
  },
  {
    title: "Brief once, generate clearly",
    text: "Zenovee turns structured inputs into premium outputs with calmer interfaces, guided context, and faster iteration.",
  },
  {
    title: "Review, export, and deploy",
    text: "Move from ideation to ready-to-use assets with dependable billing, saved outputs, and polished workspace tooling.",
  },
];

const faqItems = [
  {
    question: "What makes Zenovee feel different from generic AI tools?",
    answer:
      "Zenovee is organized as premium business workflows, not prompt clutter. Each tool is positioned around a real business outcome—authority, revenue, search growth, or brand execution—with cleaner inputs and higher-signal outputs.",
  },
  {
    question: "Is billing secure and predictable?",
    answer:
      "Yes. Billing flows are processed through verified Razorpay checkout, and payments are synchronized before plan or credits are updated so your account state remains reliable.",
  },
  {
    question: "Who is Zenovee built for?",
    answer:
      "Zenovee is built for operators, consultants, founders, marketers, and teams who want premium AI workflows for execution—not hobby-grade experimentation.",
  },
  {
    question: "Can non-technical teams use it confidently?",
    answer:
      "Absolutely. The workspace is designed to feel structured, calm, and guided, so non-technical users can move from brief to output without learning a complex AI stack.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const topTools = toolSeoPages.filter((tool) => premiumShowcaseSlugs.has(tool.slug));
  const subscriptionPlans = getActivePlans();
  const featuredPlans = subscriptionPlans.slice(0, 3);

  return (
    <div className="min-h-screen landing-dark text-slate-900">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }])} />
      <Navigation isAuthenticated={Boolean(user)} isAdmin={user?.role === "admin"} />

      <main className="overflow-hidden">
        <section className="section-shell relative py-10 md:py-14 lg:py-16">
          <div className="premium-grid premium-spotlight absolute inset-x-4 top-0 -z-10 h-[92%] rounded-[40px] opacity-70 blur-[0.5px] md:inset-x-6 lg:inset-x-8" />
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.95fr)] lg:gap-10">
            <div className="space-y-8 pt-6 md:pt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <Sparkles className="size-3.5 text-primary" />
                Premium AI workspace for serious execution
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl lg:text-7xl">
                  Business-grade AI workflows with the polish of a modern platform.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                  Zenovee helps growth, SEO, sales, and brand teams move faster with structured AI workflows, protected billing, and a calm workspace that feels premium from first click to final output.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="min-w-[180px]">
                  <Link href={user ? "/dashboard" : "/register"}>
                    {user ? "Open workspace" : "Create workspace"}
                    <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-w-[160px] border-slate-300 bg-white/70 text-slate-900 hover:bg-white">
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {trustPillars.map((pillar) => (
                  <div key={pillar.label} className="premium-glass p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{pillar.label}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-800">{pillar.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <HeroSlider />
          </div>
        </section>

        <section className="section-shell py-8 md:py-10">
          <div className="section-surface p-6 md:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="premium-label">Why teams trust Zenovee</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">A premium operating layer for modern AI execution</h2>
                <p className="text-base leading-7 text-slate-600 md:text-lg">
                  No filler dashboards. No vague AI promises. Just focused workflows, better visual hierarchy, and a workspace designed to increase confidence.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="stat-chip">Protected payments</span>
                <span className="stat-chip">Premium exports</span>
                <span className="stat-chip">Workspace-first UX</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {premiumWorkflows.map((workflow) => (
                <Card key={workflow.title} className="border-white/70 bg-white/88 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.22)]">
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-slate-950">{workflow.title}</CardTitle>
                    <CardDescription className="text-slate-600">{workflow.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {workflow.points.map((point) => (
                      <div key={point} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell py-8 md:py-10 lg:py-12">
          <div className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <p className="premium-label">Premium workflow showcase</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Tools presented as polished systems, not template clutter</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                Explore a curated set of workflow entry points with clearer positioning, stronger hierarchy, and copy written for outcomes—not generic AI claims.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {topTools.slice(0, 4).map((tool, index) => (
                <Card key={tool.slug} className="group overflow-hidden border-white/70 bg-white/90 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_58px_-30px_rgba(15,23,42,0.26)]">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        {index < 2 ? "Featured" : "Workflow"}
                      </span>
                      <span className="text-xs font-medium text-slate-400">Premium system</span>
                    </div>
                    <div>
                      <CardTitle className="line-clamp-2 text-slate-950">{tool.name}</CardTitle>
                      <CardDescription className="mt-3 line-clamp-3 text-slate-600">{tool.heroDescription}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                      Structured inputs, calmer UX, and outputs designed to feel ready for real client and team use.
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

        <section className="section-shell py-8 md:py-10 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="section-surface p-6 md:p-8">
              <p className="premium-label">Operating model</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">From prompt chaos to structured execution</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Zenovee is designed to reduce decision fatigue. Each step helps your team move from idea to premium output with less noise and more control.
              </p>
            </div>

            <div className="space-y-4">
              {operatingModel.map((step, index) => (
                <Card key={step.title} className="border-white/70 bg-white/92">
                  <CardContent className="flex gap-4 p-6 md:p-7">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-[0_18px_36px_-26px_rgba(15,23,42,0.5)]">
                      {index + 1}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
                      <p className="text-sm leading-7 text-slate-600 md:text-base">{step.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell py-8 md:py-10 lg:py-12">
          <div className="section-surface p-6 md:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div className="space-y-4">
                <p className="premium-label">Pricing with trust</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Clear plans, predictable credits, secure billing</h2>
                <p className="text-base leading-7 text-slate-600 md:text-lg">
                  Zenovee keeps billing simple: straightforward monthly plans, verified checkout, and cleaner status visibility inside your workspace.
                </p>
                <div className="premium-glass p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Secure payments and verified synchronization</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Payments are processed through Razorpay and synchronized before credits and subscriptions update, improving confidence in every billing event.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {featuredPlans.map((plan) => (
                  <Card key={plan.id} className={`overflow-hidden border-white/70 bg-white/92 ${plan.premiumLabel ? "ring-1 ring-primary/20 shadow-[0_24px_58px_-34px_rgba(79,70,229,0.28)]" : "shadow-[0_18px_46px_-34px_rgba(15,23,42,0.18)]"}`}>
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base text-slate-950 md:text-lg">{plan.displayName}</CardTitle>
                        {plan.premiumLabel ? (
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                            {plan.premiumLabel}
                          </span>
                        ) : null}
                      </div>
                      <CardDescription className="text-slate-600">{plan.credits.toLocaleString()} credits each month</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-semibold tracking-tight text-slate-950">
                          {formatRupees(plan.monthlyPriceRupees)}
                          <span className="ml-1 text-sm font-medium text-slate-500">/mo</span>
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{plan.premiumPositioning}</p>
                      </div>
                      <Button asChild variant={plan.premiumLabel ? "default" : "outline"} className="w-full border-slate-300 bg-white/80 text-slate-900 hover:bg-white">
                        <Link href={user ? "/billing" : "/register"}>{plan.premiumLabel ? "Choose premium" : "Choose plan"}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell py-8 md:py-10 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="section-surface p-6 md:p-8">
              <p className="premium-label">FAQ</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Questions teams ask before they commit</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                We’ve removed the filler. These are the practical questions that matter when evaluating a premium AI platform for daily work.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item) => (
                <details key={item.question} className="group rounded-[24px] border border-white/70 bg-white/92 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.16)] transition-all duration-200 hover:border-slate-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-slate-900">
                    <span>{item.question}</span>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell py-10 md:py-12 lg:py-16">
          <div className="section-surface premium-spotlight overflow-hidden p-8 md:p-10 lg:p-12">
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                  <Zap className="size-3.5 text-primary" />
                  Launch-ready polish
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  Upgrade from a collection of AI tools to a premium AI platform.
                </h2>
                <p className="text-base leading-7 text-slate-600 md:text-lg">
                  Zenovee is built for teams who care about output quality, trust, and software that feels modern enough to use every day.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/register"}>
                    {user ? "Open dashboard" : "Start with Zenovee"}
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
