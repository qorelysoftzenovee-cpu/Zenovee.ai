'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Navigation({ isAuthenticated, isAdmin = false }: { isAuthenticated: boolean; isAdmin?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const publicNavItems = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: '/tools' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
    { label: 'Login', href: '/login' },
  ];

  const authenticatedNavItems = [
    ...(isAdmin
      ? [
          { label: 'Dashboard', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: 'Payments', href: '/admin/payments' },
          { label: 'Tools', href: '/admin/tools' },
          { label: 'Analytics', href: '/admin/analytics' },
          { label: 'Settings', href: '/admin/settings' },
        ]
      : [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tools', href: '/dashboard/tools' },
          { label: 'History', href: '/history' },
          { label: 'Billing', href: '/billing' },
          { label: 'Settings', href: '/settings' },
        ]),
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between gap-4 py-3 md:py-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 shadow-[0_16px_30px_-20px_rgba(15,23,42,0.55)]">
            <span className="text-base font-semibold text-white">Z</span>
          </div>
          <div className="space-y-0.5 leading-none">
            <span className="block text-base font-semibold tracking-tight text-foreground">Zenovee</span>
            <span className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Growth Workspace</span>
          </div>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
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
                  Admin
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button variant="default" className="px-5 font-semibold">
                  Dashboard
                </Button>
              </Link>
            )
          ) : (
            <Link href="/login">
                <Button variant="default" className="px-5 font-semibold">
                  Create account
              </Button>
            </Link>
          )}
        </div>

        <button
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_14px_28px_-20px_rgba(15,23,42,0.24)] transition-colors hover:bg-slate-50 md:hidden"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`border-t border-slate-200 bg-white/95 md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="section-shell space-y-3 py-4">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            isAdmin ? (
              <Link href="/admin" className="block" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Admin</Button>
              </Link>
            ) : (
              <Link href="/dashboard" className="block" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Dashboard</Button>
              </Link>
            )
          ) : (
            <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Create account</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
