import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/seo/site";

export const metadata = {
  title: "Contact | Zenovee AI",
  description: "Contact support for account, billing, and product help.",
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
      <main className="section-shell py-14 md:py-20">
        <div className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-start">
            <div className="space-y-4">
              <div className="premium-label">Contact</div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">One simple place for support</h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                If you need help with your account, billing, or tool usage, send a message or email us directly.
              </p>
              <div className="surface-card p-5">
                <p className="text-sm text-muted-foreground">Support email</p>
                <a className="mt-2 block text-lg font-medium text-foreground transition-colors hover:text-accent" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
                <p className="mt-3 text-sm text-muted-foreground">Typical response time: within 24 business hours.</p>
              </div>
            </div>

            <Card className="border-white/10">
              <CardHeader>
                <CardTitle>Send a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input placeholder="Full name" required />
                    <Input type="email" placeholder="Email address" required />
                  </div>
                  <Input placeholder="Subject" required />
                  <Textarea placeholder="How can we help you?" rows={6} required />
                  <Button type="submit" className="w-full">Send message</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <Card key={faq.question} className="border-white/10">
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
