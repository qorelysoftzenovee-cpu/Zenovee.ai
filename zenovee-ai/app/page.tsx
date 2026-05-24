import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
  title: "Zenovee — AI Workspace Operating System",
  description: "Run LinkedIn, SEO, sales outreach, conversion copy, and brand workflows in one premium AI workspace.",
  path: "/",
  keywords: ["AI tools", "AI marketing", "AI content", "premium SaaS"],
});

const steps = [
  { title: "Choose a plan", text: "Pick the credit plan that fits your workflow." },
  { title: "Open your workspace", text: "Sign in and choose the tool you need right now." },
  { title: "Generate your first asset", text: "Fill the brief, generate output, then save or export it." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const topTools = toolSeoPages.filter((tool) => premiumShowcaseSlugs.has(tool.slug));
  const subscriptionPlans = getActivePlans();

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }])} />
      <Navigation isAuthenticated={Boolean(user)} isAdmin={user?.role === "admin"} />

      <main>
        <section className="landing-dark border-b border-white/10">
          <div className="section-shell py-16 md:py-20 lg:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.08fr] lg:gap-12">
              <div className="space-y-6">
                <p className="premium-label border-white/15 bg-white/5 text-slate-200">AI Workspace</p>
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">Enterprise-grade AI platform for premium growth execution</h1>
                <p className="max-w-2xl text-base text-slate-300 md:text-lg">Access a massive premium toolkit across executive branding, B2B sales, conversion copywriting, SEO authority, and premium brand assets.</p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100"><Link href={user ? "/dashboard" : "/register"}>{user ? "Open dashboard" : "Create account"}</Link></Button>
                  <Button asChild size="lg" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20"><Link href="/pricing">View Pricing</Link></Button>
                </div>
              </div>
              <HeroSlider />
            </div>
          </div>
        </section>

        <section className="section-shell py-16 md:py-20">
          <div className="mb-7 space-y-2">
            <p className="premium-label">Workspace Systems</p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Purpose-built operating systems for growth teams</h2>
            <p className="text-sm text-muted-foreground">Each workspace is designed as a complete business system, not a standalone generator.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {topTools.map((tool) => (
              <Card key={tool.slug} className="border-border bg-card">
                <CardHeader>
                  <CardTitle>{tool.name}</CardTitle>
                  <CardDescription>{tool.heroDescription}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Workspace workflow</span>
                  <Button asChild><Link href={user ? "/dashboard/tools" : "/login"}>Open Workspace</Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="landing-dark border-y border-white/10 text-white">
          <div className="section-shell py-16 md:py-20">
            <div className="mb-7 space-y-2">
              <p className="premium-label border-white/15 bg-white/5 text-slate-200">How it works</p>
              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Simple workflow, fast output</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card key={step.title} className="border-white/10 bg-white/5 text-white">
                  <CardHeader><CardTitle className="text-lg text-white">{index + 1}. {step.title}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-slate-200">{step.text}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell py-16 md:py-20">
          <div className="mb-7 space-y-2">
            <p className="premium-label">Pricing preview</p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Simple monthly plans</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className="border-border bg-card">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.credits.toLocaleString()} credits / month</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight">{formatRupees(plan.monthlyPriceRupees)}<span className="ml-1 text-base font-normal text-muted-foreground">/month</span></p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6"><Button asChild variant="secondary"><Link href="/pricing">View Pricing</Link></Button></div>
        </section>

        

        <section className="section-shell py-16 md:py-20">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Ready to start your workspace?</h2>
                <p className="text-sm text-muted-foreground">Create your account, choose a plan, and publish your first output with confidence.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild><Link href={user ? "/dashboard" : "/register"}>{user ? "Open dashboard" : "Create account"} <ArrowRight size={16} /></Link></Button>
                <Button asChild variant="secondary"><Link href="/pricing">View Pricing</Link></Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
