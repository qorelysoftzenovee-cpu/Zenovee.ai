import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Contact | Zenovee AI",
  description: "Contact support for account, billing, and product help.",
};

export default async function ContactPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} />
      <main className="section-shell py-12 md:py-20">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight">Contact Support</h1>
            <p className="text-muted-foreground">
              Reach us at <a className="font-medium text-foreground" href="mailto:support@yourdomain.com">support@yourdomain.com</a>
            </p>
            <p className="text-sm text-muted-foreground">Typical response time: within 24 hours on business days.</p>
          </div>

          <Card>
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
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
