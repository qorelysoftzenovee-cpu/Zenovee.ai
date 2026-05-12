'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Tools', href: '#tools' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '#docs' },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white">Zenovee</span>
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item, idx) => (
            <motion.a
              key={idx}
              href={item.href}
              whileHover={{ scale: 1.05 }}
              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {item.label}
            </motion.a>
          ))}
        </div>

        {/* Right side buttons */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-sm"
                >
                  Get Started
                </motion.button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
      >
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
            <button className="w-full text-slate-700 dark:text-slate-300 py-2">Sign In</button>
            <button className="w-full btn-primary">Get Started</button>
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
}
