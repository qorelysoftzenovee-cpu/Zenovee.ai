import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/seo/site";

export function Footer() {
  return (
    <footer className="border-t border-white/70 bg-transparent">
      <div className="section-shell py-10 md:py-12">
        <div className="section-surface grid gap-8 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 shadow-[0_16px_30px_-20px_rgba(15,23,42,0.5)]">
                <span className="text-base font-semibold text-white">Z</span>
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight">Zenovee AI</p>
                <p className="text-sm text-muted-foreground">Premium AI workspace for growth, sales, search, and brand execution.</p>
              </div>
            </div>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {SUPPORT_EMAIL}
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="mb-3 text-sm font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link></li>
                <li><Link href="/tools" className="transition-colors hover:text-foreground">Tools</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link></li>
                <li><Link href="/refund" className="transition-colors hover:text-foreground">Refund</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/contact" className="transition-colors hover:text-foreground">Support</Link></li>
                <li><a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-foreground">Email us</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© 2026 Zenovee AI. All rights reserved.</p>
          <p>Launch-ready product polish for premium AI execution.</p>
        </div>
      </div>
    </footer>
  );
}
