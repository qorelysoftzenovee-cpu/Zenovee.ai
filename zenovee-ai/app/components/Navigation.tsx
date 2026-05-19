'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Navigation({ isAuthenticated, isAdmin = false }: { isAuthenticated: boolean; isAdmin?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: '/tools' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/72 backdrop-blur-2xl">
      <div className="section-shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#38bdf8_100%)] shadow-[0_16px_40px_-20px_rgba(124,58,237,0.8)]">
            <span className="text-base font-semibold text-white">Z</span>
          </div>
          <div className="space-y-0.5">
            <span className="block text-base font-semibold tracking-tight text-foreground">Zenovee</span>
            <span className="block text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Premium AI tools</span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
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
          {isAuthenticated ? (
            isAdmin ? (
              <Link href="/admin">
                <Button variant="default" className="px-5 font-semibold">
                  Admin Panel
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button variant="default" className="px-5 font-semibold">
                  Open dashboard
                </Button>
              </Link>
            )
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                Sign In
              </Link>
              <Link href="/register">
                <Button size="sm" className="px-5">Get started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl border border-white/10 bg-card/80 p-2.5 transition-colors hover:bg-muted md:hidden"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`border-t border-white/10 bg-background/96 md:hidden ${isOpen ? 'block' : 'hidden'}`}>
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
          {isAuthenticated ? (
            isAdmin ? (
              <Link href="/admin" className="block" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Admin Panel</Button>
              </Link>
            ) : (
              <Link href="/dashboard" className="block" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Open dashboard</Button>
              </Link>
            )
          ) : (
            <div className="surface-muted space-y-3 p-4">
              <p className="text-sm text-muted-foreground">Start with a focused set of premium AI tools for content, growth, and research.</p>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" className="block text-center text-sm font-semibold text-muted-foreground">Sign In</Link>
                <Link href="/register" className="block" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">Get started</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
