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
  { 
    title: "Create Account", 
    text: "Set up your Zenovee workspace in seconds with email authentication." 
  },
  { 
    title: "Select Workspace", 
    text: "Choose from 50+ AI-powered professional tools designed for enterprise outcomes." 
  },
  { 
    title: "Generate Assets", 
    text: "Brief your AI, deploy at scale, and download professional-grade output instantly." 
  },
];

const trustBadges = [
  { icon: "🔒", text: "Enterprise Security" },
  { icon: "⚡", text: "99.9% Uptime SLA" },
  { icon: "🌍", text: "10,000+ Active Users" },
  { icon: "⭐", text: "4.9/5 Rating" },
];

const features = [
  {
    icon: "🚀",
    title: "AI-Powered Content Generation",
    description: "Create professional-grade content across 50+ templates without writer's block",
    stats: "90% faster than manual writing",
  },
  {
    icon: "📊",
    title: "Real-time Analytics & Insights",
    description: "Track performance metrics and optimize your content strategy in real-time",
    stats: "Data-driven decisions",
  },
  {
    icon: "🔄",
    title: "Seamless Multi-Channel Publishing",
    description: "Export and publish to LinkedIn, Medium, WordPress, and more—all in one click",
    stats: "20+ integrations included",
  },
  {
    icon: "🎯",
    title: "Brand Voice Consistency",
    description: "Maintain your unique brand tone and style across all generated assets",
    stats: "AI remembers your voice",
  },
  {
    icon: "💰",
    title: "Affordable Credit System",
    description: "Pay only for what you use with flexible credit plans starting at ₹499/month",
    stats: "No hidden fees",
  },
  {
    icon: "👥",
    title: "Premium Customer Support",
    description: "24/7 email support, live chat, and dedicated success managers for Pro+ plans",
    stats: "Average response: 2 hours",
  },
];

const faqItems = [
  {
    question: "How do credits work?",
    answer: "Credits power every tool action—from generating to exporting. Different tools use different credit amounts. You get monthly credits based on your plan, and unused credits roll over.",
  },
  {
    question: "Can I upgrade or downgrade my plan anytime?",
    answer: "Yes! Upgrade or downgrade your subscription any time. Changes take effect immediately, and we prorate charges on your next billing cycle.",
  },
  {
    question: "How do I get started?",
    answer: "Create your account, select your preferred workspace, and start generating professional assets. Premium plans include dedicated onboarding and support for enterprises.",
  },
  {
    question: "Do you offer annual billing discounts?",
    answer: "Yes! Annual plans come with 2 months free (16.67% discount). Switch to annual at checkout or contact support for existing customers.",
  },
  {
    question: "Is my content safe and private?",
    answer: "Absolutely. All content is encrypted in transit and at rest. We never train on your data, and you retain 100% ownership of everything you create.",
  },
  {
    question: "Do I need to be technical to use Zenovee?",
    answer: "Not at all! Zenovee is built for non-technical users. Just fill in your brief, hit generate, and download your asset. No coding or setup required.",
  },
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
        {/* Enhanced Hero Section */}
        <section className="landing-dark border-b border-white/10">
          <div className="section-shell py-16 md:py-20 lg:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.08fr] lg:gap-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 backdrop-blur-sm">
                  <span className="text-sm font-semibold text-blue-300">✨ Enterprise AI for Growth Teams</span>
                </div>
                <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl leading-tight">
                  Professional AI Content in Minutes, Not Weeks
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                  Transform your content operations at enterprise scale. Let Zenovee handle your content creation, sales sequences, and brand assets. Trusted by 10,000+ professionals to save 20+ hours weekly.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <Link href={user ? "/dashboard" : "/register"}>
                      {user ? "Open Dashboard" : "Get Started"}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold">
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-2 pt-4 md:grid-cols-2 lg:grid-cols-4">
                  {trustBadges.map((badge) => (
                    <div key={badge.text} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 backdrop-blur-sm hover:bg-white/[0.08] transition-colors">
                      <span className="text-lg">{badge.icon}</span>
                      <span className="text-xs text-slate-200 font-medium">{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <HeroSlider />
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="section-shell py-16 md:py-20 lg:py-24">
          <div className="mb-12 space-y-4 text-center">
            <p className="premium-label inline-block">Powerful Features</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything you need to create like a pro</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              Zenovee combines cutting-edge AI with intuitive design to make professional content creation accessible to everyone
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-border bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 group overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 text-4xl">{feature.icon}</div>
                      <CardTitle className="text-lg group-hover:text-blue-300 transition-colors text-white">{feature.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-slate-200 mt-2">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-200">
                    ✓ {feature.stats}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Workspace Systems Section - Enhanced */}
        <section className="landing-dark border-y border-white/10 py-16 md:py-20 lg:py-24">
          <div className="section-shell">
            <div className="mb-12 space-y-4 text-center">
              <p className="premium-label inline-block border-white/15 bg-white/5 text-slate-200">Specialized Workflows</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Complete operating systems for every use case</h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-300">
                Each workspace is a complete system designed for a specific outcome—not just a generic tool
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {topTools.slice(0, 4).map((tool) => (
                <Card key={tool.slug} className="border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] text-white hover:border-white/30 hover:bg-white/[0.08] transition-all duration-300 group overflow-hidden">
                  <CardHeader>
                    <CardTitle className="group-hover:text-blue-300 transition-colors text-white line-clamp-2">{tool.name}</CardTitle>
                    <CardDescription className="text-white/80 mt-2 line-clamp-2">{tool.heroDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <span className="text-xs text-white/70">Premium workflow</span>
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 flex-shrink-0">
                      <Link href={user ? "/dashboard/tools" : "/register"}>Explore</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Streamlined */}
        <section className="section-shell py-16 md:py-20 lg:py-24">
          <div className="mb-12 space-y-4 text-center">
            <p className="premium-label inline-block">Getting Started</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Three steps to your first output</h2>
            <p className="mx-auto max-w-2xl text-slate-400">Start generating professional content in under 5 minutes</p>
          </div>
            <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-12 left-[60%] hidden w-[calc(100%_-_60%_+_1rem)] h-1 bg-gradient-to-r from-blue-500 to-transparent md:block" />
                )}
                
                <Card className="border-border bg-gradient-to-br from-white/5 to-white/[0.02] hover:border-white/20 transition-all duration-300 relative z-10 overflow-hidden">
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white">
                      {index + 1}
                    </div>
                    <CardTitle className="text-white">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80">{step.text}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section - Enhanced */}
        <section className="landing-dark border-y border-white/10 py-16 md:py-20 lg:py-24">
          <div className="section-shell">
            <div className="mb-12 space-y-4 text-center">
              <p className="premium-label inline-block border-white/15 bg-white/5 text-slate-200">Simple Pricing</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Flexible plans for every budget</h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-300">
                No setup fees. No long-term contracts. Cancel anytime.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.id} className={`border transition-all duration-300 overflow-hidden ${plan.premiumLabel ? "border-blue-400/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5 shadow-lg shadow-blue-500/20" : "border-border bg-card hover:border-white/30"}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 min-w-0">
                      <CardTitle className="text-white truncate">{plan.displayName}</CardTitle>
                      {plan.premiumLabel && (
                        <span className="rounded-full border border-blue-400 bg-blue-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300 flex-shrink-0">
                          {plan.premiumLabel}
                        </span>
                      )}
                    </div>
                    <CardDescription className="mt-2 text-white/80">{plan.credits.toLocaleString()} credits / month</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold tracking-tight text-white">
                        {formatRupees(plan.monthlyPriceRupees)}
                        <span className="ml-2 text-base font-normal text-white/70">/month</span>
                      </p>
                      <p className="mt-2 text-sm text-white/80">{plan.premiumPositioning}</p>
                    </div>
                    <Button asChild className="w-full" variant={plan.premiumLabel ? "default" : "outline"}>
                      <Link href={user ? "/dashboard" : "/register"}>
                        {plan.premiumLabel ? "Get Started" : "Choose Plan"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm text-center">
              <p className="text-sm font-semibold text-white">🔒 Secure payments processed by Razorpay</p>
              <p className="mt-2 text-xs text-white/70">All transactions are encrypted and PCI-compliant. No hidden fees.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section - High Conversion */}
        <section className="section-shell py-16 md:py-20 lg:py-24">
          <div className="mb-12 space-y-4 text-center">
            <p className="premium-label inline-block">Questions?</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Frequently asked questions</h2>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqItems.map((item, index) => (
              <details key={index} className="group border border-border rounded-lg bg-card/50 backdrop-blur-sm p-5 cursor-pointer hover:border-white/20 transition-all duration-300 overflow-hidden">
                <summary className="flex items-center justify-between font-semibold text-white hover:text-blue-300 transition-colors">
                  <span className="text-left">{item.question}</span>
                  <span className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 group-open:bg-white/20 transition-all duration-300 flex-shrink-0">
                    <svg className="h-4 w-4 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-white/80">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="landing-dark border-t border-white/10 py-16 md:py-20 lg:py-24">
          <div className="section-shell">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-blue-600/20 via-purple-900/10 to-slate-950 p-8 md:p-12 lg:p-16">
              {/* Animated Background */}
              <div className="absolute inset-0 overflow-hidden rounded-[32px]">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/20 opacity-20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-purple-500/20 opacity-20 blur-3xl" />
              </div>

              <div className="relative z-10 space-y-8 text-center">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                    Ready to transform your content workflow?
                  </h2>
                  <p className="mx-auto max-w-2xl text-lg text-slate-300">
                    Join 10,000+ creators and teams saving 20+ hours every week with Zenovee AI.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                  <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group min-w-fit">
                    <Link href={user ? "/dashboard" : "/register"}>
                      {user ? "Open Dashboard" : "Get Started"}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold">
                    <Link href="/pricing">View All Plans</Link>
                  </Button>
                </div>

                <p className="text-sm text-slate-400 pt-4">
                  ✓ Enterprise-grade • ✓ Secure & encrypted • ✓ 99.9% uptime SLA
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
