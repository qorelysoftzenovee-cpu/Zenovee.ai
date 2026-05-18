import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="section-shell py-14">
        <div className="surface-card mb-8 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Trust & support</p>
              <h2 className="text-2xl font-semibold tracking-tight">Built for teams that need reliable AI operations.</h2>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Secure billing messaging, clear policies, responsive support, and export-ready workflows are available across the product.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="surface-muted px-4 py-3 text-sm">
                <p className="font-semibold">Support</p>
                <p className="text-muted-foreground">support@yourdomain.com</p>
              </div>
              <div className="surface-muted px-4 py-3 text-sm">
                <p className="font-semibold">Billing confidence</p>
                <p className="text-muted-foreground">Transparent plans and refund policy</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="font-bold text-lg">Zenovee AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Premium AI solutions for modern businesses with real subscription controls.
            </p>
            <p className="rounded-full border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
              Secure billing • Policy-first • Human support
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/tools" className="hover:text-foreground transition-colors">
                  Tools Directory
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/categories/marketing" className="hover:text-foreground transition-colors">
                  AI Marketing Tools
                </Link>
              </li>
              <li>
                <Link href="/industries/saas" className="hover:text-foreground transition-colors">
                  AI Tools for SaaS
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-foreground transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/use-cases/ai-tools-for-marketers" className="hover:text-foreground transition-colors">
                  AI Tools for Marketers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="mailto:support@yourdomain.com" className="hover:text-foreground transition-colors">
                  Email Support
                </a>
              </li>
              <li className="text-muted-foreground">Response within 24 business hours</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-border/40 pt-8 md:flex-row md:items-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Zenovee AI. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>Built with security, compliance, and SaaS best practices.</span>
            <span>•</span>
            <span>Secure billing messaging visible across the platform.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
