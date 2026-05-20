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
import { subscriptionPlans } from "@/app/subscription-plans";
import { HeroSlider } from "@/components/marketing/hero-slider";

const launchToolSlugs = new Set([
  "seo-article-generator",
  "ad-copy-generator",
  "customer-persona-builder",
  "landing-page-copy-generator",
]);

export const metadata: Metadata = createMetadata({
  title: "Premium AI Tools for Marketing & Content",
  description: "Generate SEO articles, ad copy, landing pages, and customer personas faster with AI.",
  path: "/",
  keywords: ["AI tools", "AI marketing", "AI content", "premium SaaS"],
});

const faqs = [
  { question: "Who is Zenovee for?", answer: "Zenovee is for marketers, founders, and content teams." },
  { question: "How does pricing work?", answer: "Every plan includes monthly credits." },
  { question: "Can I upgrade later?", answer: "Yes. You can change plans anytime from billing." },
];

const steps = [
  { title: "Choose a plan", text: "Pick the credit plan that fits your workflow." },
  { title: "Open your workspace", text: "Sign in and choose the tool you need right now." },
  { title: "Generate your first asset", text: "Fill the brief, generate output, then save or export it." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const topTools = toolSeoPages.filter((tool) => launchToolSlugs.has(tool.slug));

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }])} />
      <Navigation isAuthenticated={Boolean(user)} isAdmin={user?.role === "admin"} />

      <main>
        <section className="landing-dark border-b border-white/10">
          <div className="section-shell py-16 md:py-20 lg:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.08fr] lg:gap-12">
              <div className="space-y-6">
                <p className="premium-label border-white/15 bg-white/5 text-slate-200">Premium AI Workspace</p>
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">Premium AI Tools for Marketing & Content</h1>
                <p className="max-w-2xl text-base text-slate-300 md:text-lg">Generate SEO articles, ad copy, landing pages, and customer personas faster with AI.</p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100"><Link href="/pricing">View Pricing</Link></Button>
                  <Button asChild size="lg" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20"><Link href="/tools">Explore Tools</Link></Button>
                </div>
              </div>
              <HeroSlider />
            </div>
          </div>
        </section>

        <section className="section-shell py-16 md:py-20">
          <div className="mb-7 space-y-2">
            <p className="premium-label">Tool preview</p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Four focused tools, no clutter</h2>
            <p className="text-sm text-muted-foreground">Everything in the launch MVP is built for SEO, ads, personas, and landing page copy.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {topTools.map((tool) => (
              <Card key={tool.slug} className="border-border bg-card">
                <CardHeader>
                  <CardTitle>{tool.name}</CardTitle>
                  <CardDescription>{tool.heroDescription}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Structured output</span>
                  <Button asChild><Link href={`/tools/${tool.slug}`}>Open Tool</Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="landing-light border-y border-border/70">
          <div className="section-shell py-16 md:py-20">
            <div className="mb-7 space-y-2">
              <p className="premium-label">How it works</p>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Simple workflow, fast output</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card key={step.title} className="border-border bg-white">
                  <CardHeader><CardTitle className="text-lg">{index + 1}. {step.title}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">{step.text}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell py-16 md:py-20">
          <div className="mb-7 space-y-2">
            <p className="premium-label">Pricing preview</p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Three paid plans</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className="border-border bg-card">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.credits.toLocaleString()} credits / month</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight">₹{plan.price.toLocaleString("en-IN")}<span className="ml-1 text-base font-normal text-muted-foreground">/month</span></p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6"><Button asChild variant="secondary"><Link href="/pricing">View Pricing</Link></Button></div>
        </section>

        <section className="landing-light border-y border-border/70">
          <div className="section-shell py-16 md:py-20">
            <div className="mb-7 space-y-2">
              <p className="premium-label">FAQ</p>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Common questions</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {faqs.map((faq) => (
                <Card key={faq.question} className="border-border bg-white">
                  <CardHeader><CardTitle className="text-lg">{faq.question}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">{faq.answer}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell py-16 md:py-20">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Start with one focused AI workspace</h2>
                <p className="text-sm text-muted-foreground">Understand the product, choose a plan, and create your first asset in minutes.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild><Link href={user ? "/dashboard" : "/register"}>Get Started <ArrowRight size={16} /></Link></Button>
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
