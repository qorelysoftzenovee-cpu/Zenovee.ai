import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import Navigation from "./components/Navigation";

const features = [
  {
    title: "Clean Architecture",
    description:
      "Domain-first structure with explicit boundaries for sustainable growth.",
  },
  {
    title: "Typed Foundation",
    description:
      "Strict TypeScript contracts across env, services, and UI primitives.",
  },
  {
    title: "SaaS Ready",
    description:
      "Supabase-native data architecture with scalable route boundaries prepared for production.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} />

      <main>
        <section className="section-shell py-20 md:py-28 lg:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                Production-ready AI SaaS workspace
              </p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                Operate AI workflows with real credits, secure access, and audited outputs.
              </h1>
              <p className="max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
                Zenovee combines structured AI tooling, usage tracking, billing-ready plans,
                and an admin control layer into a focused SaaS foundation that ships cleanly.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/register"}>
                    {user ? "Open Dashboard" : "Start Free"}
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-[0_30px_80px_-40px_rgba(135,88,255,0.45)]">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-medium text-muted-foreground">What’s included</p>
                  <div className="mt-3 grid gap-3 text-sm">
                    {[
                      "Protected auth flow with Supabase Auth",
                      "Real credit checks and usage persistence",
                      "Admin visibility for users, revenue, and tool activity",
                      "Razorpay-ready plan metadata and checkout hooks",
                    ].map((item) => (
                      <div key={item} className="rounded-xl bg-muted/40 px-3 py-3 text-foreground">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Credits", "Tracked"],
                    ["Outputs", "Structured"],
                    ["Security", "Protected"],
                    ["Billing", "Ready"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 py-16">
          <div className="section-shell grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell py-16 md:py-20">
          <div className="rounded-3xl border border-border/70 bg-card/70 p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  A clean baseline, ready for audited SaaS growth.
                </h2>
                <p className="text-muted-foreground">
                  No placeholder analytics, no hardcoded AI results, and no dead-end CTAs.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href={user ? "/dashboard" : "/register"}>Launch workspace</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
