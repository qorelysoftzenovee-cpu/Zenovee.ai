'use client';

import { Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Navigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: '/tools' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/78 backdrop-blur-2xl">
      <div className="section-shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          <div>
            <span className="block text-lg font-bold leading-none text-foreground">Zenovee</span>
            <span className="block text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Premium AI Workspace</span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground xl:flex">
            <ShieldCheck size={14} className="text-accent" /> Secure billing
            <span className="text-border">•</span>
            <Sparkles size={14} className="text-accent" /> Export-ready outputs
          </div>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="default" className="px-6 font-semibold">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                Sign In
              </Link>
              <Link href="/register">
                <Button size="sm" className="px-5">Start Now</Button>
              </Link>
            </>
          )}
        </div>

        <button
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl border border-border/70 bg-card/70 p-2.5 transition-colors hover:bg-muted md:hidden"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`border-t border-border/70 bg-background/96 md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="section-shell space-y-3 py-4">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="surface-muted space-y-3 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trusted experience</p>
            <div className="flex items-center gap-2 text-sm text-foreground"><ShieldCheck size={16} className="text-accent" /> Secure checkout and support access</div>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" className="block text-center text-sm font-semibold text-muted-foreground">Sign In</Link>
              <Link href="/register" className="block" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Start Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
