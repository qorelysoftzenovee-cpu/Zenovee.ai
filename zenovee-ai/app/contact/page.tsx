import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/seo/site";

export const metadata = {
  title: "Contact | Zenovee AI",
  description: "Contact support for product, account, or billing help.",
};

export default async function ContactPage() {
  const user = await getCurrentUser();
  const faqs = [
    {
      question: "What can support help with?",
      answer: "We can help with account access, billing questions, credits, and product issues.",
    },
    {
      question: "How fast do you reply?",
      answer: "We usually reply within 24 business hours.",
    },
    {
      question: "Should I include billing details?",
      answer: "If your question is about a payment, include your plan name and the date of the charge so we can help faster.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} isAdmin={user?.role === "admin"} />
      <main className="section-shell py-14 md:py-16">
        <div className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
            <div className="space-y-4">
              <p className="premium-label">Contact</p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Support, simplified</h1>
              <p className="text-base text-muted-foreground md:text-lg">
                Need help? Send a message or email us directly.
              </p>

              <Card className="border-border bg-card">
                <CardContent className="space-y-2 p-5">
                <p className="text-sm text-muted-foreground">Support email</p>
                <a className="text-lg font-medium text-foreground" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
                <p className="text-sm text-muted-foreground">Response expectation: within 24 business hours.</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Contact support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">For the fastest help, email support directly instead of using a temporary contact form.</p>
                <div className="surface-muted rounded-2xl p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Include these details</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Your account email</li>
                    <li>• Plan name or billing question</li>
                    <li>• Payment date or issue summary</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="w-full sm:w-auto">
                    <a href={`mailto:${SUPPORT_EMAIL}`}>Email support</a>
                  </Button>
                  <Button asChild variant="secondary" className="w-full sm:w-auto">
                    <Link href={user ? "/billing" : "/pricing"}>{user ? "Billing help" : "View pricing"}</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">We usually reply within 24 business hours.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <Card key={faq.question} className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
