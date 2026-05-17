import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { Mail, MessageSquare, Phone } from "lucide-react";

export const metadata = {
  title: "Contact Us | Zenovee AI",
  description: "Get in touch with Zenovee AI support team",
};

export default async function ContactPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} />

      <main className="section-shell py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground">
              Have questions or need support? We&apos;re here to help.
            </p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg">Email Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">General inquiries:</p>
                <a href="mailto:support@zenovee.com" className="font-semibold hover:text-accent transition-colors">
                  support@zenovee.com
                </a>
                <p className="text-sm text-muted-foreground mt-3">Response time: 24-48 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg">Billing & Invoices</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Payment issues:</p>
                <a href="mailto:billing@zenovee.com" className="font-semibold hover:text-accent transition-colors">
                  billing@zenovee.com
                </a>
                <p className="text-sm text-muted-foreground mt-3">Response time: 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg">Business Inquiries</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Partnerships & enterprise:</p>
                <a href="mailto:business@zenovee.com" className="font-semibold hover:text-accent transition-colors">
                  business@zenovee.com
                </a>
                <p className="text-sm text-muted-foreground mt-3">Available for consulting</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form Section */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full px-4 py-2 rounded-lg border border-border/70 bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email Address</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 rounded-lg border border-border/70 bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <input
                    type="text"
                    placeholder="How can we help?"
                    className="w-full px-4 py-2 rounded-lg border border-border/70 bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-border/70 bg-background focus:outline-none focus:ring-2 focus:ring-accent">
                    <option>General Support</option>
                    <option>Billing Question</option>
                    <option>Technical Issue</option>
                    <option>Feature Request</option>
                    <option>Bug Report</option>
                    <option>Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <textarea
                    placeholder="Tell us more..."
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border border-border/70 bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    required
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    ✓ We take privacy seriously. Your information will only be used to respond to your inquiry.
                  </p>
                </div>

                <Button size="lg" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Support Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Support Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Frequently Asked Questions</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Check our FAQ section for quick answers to common questions about billing, features, and account management.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Documentation</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Browse our comprehensive documentation for API references, guides, and best practices.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Status Page</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Check service status and subscribe to updates for any planned maintenance or incidents.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Community Forum</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with other Zenovee AI users, share tips, and get help from the community.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SLA Section */}
          <div className="mt-12 p-6 bg-gradient-to-r from-accent/10 to-blue-50/10 dark:from-accent/5 dark:to-blue-900/5 border border-accent/20 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Service Level Agreement</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Our enterprise clients benefit from dedicated support and SLA guarantees. For enterprise inquiries, contact business@zenovee.com.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>✓ Priority support queue</li>
              <li>✓ Guaranteed response times</li>
              <li>✓ Dedicated account manager</li>
              <li>✓ Custom integration assistance</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
