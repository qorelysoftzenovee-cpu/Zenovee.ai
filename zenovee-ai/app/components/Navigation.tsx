'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Navigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Tools', href: '#tools' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '#docs' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white">Zenovee</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right side buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="default" className="font-semibold px-6">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <button className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="btn-primary text-sm">
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 ${isOpen ? "block" : "hidden"}`}>
        <div className="px-4 py-4 space-y-3">
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="block text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-2"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-4 space-y-2 border-t border-slate-200 dark:border-slate-800">
            <Link href="/login" className="block w-full text-slate-700 dark:text-slate-300 py-2 text-center">Sign In</Link>
            <Link href="/register" className="block w-full btn-primary text-center">Get Started</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
