"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  Folder,
  History,
  CreditCard,
  Key,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names
import { signOut } from 'next-auth/react';

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Tools', href: '/tools', icon: Sparkles },
    { name: 'Categories', href: '/dashboard/categories', icon: Folder },
    { name: 'History', href: '/dashboard/history', icon: History },
  ];

  const secondaryItems = [
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
          isActive 
            ? "bg-blue-50 text-blue-600 font-semibold" 
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
        {!isCollapsed && <span className="text-sm">{item.name}</span>}
        {isActive && (
          <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full" />
        )}
      </Link>
    );
  };

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">Z</div>
            <span className="font-bold text-slate-900">Zenovee AI</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        <nav className="space-y-1">
          {menuItems.map((item) => <NavItem key={item.name} item={item} />)}
        </nav>

        <div>
          {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account</p>}
          <nav className="space-y-1">
            {secondaryItems.map((item) => <NavItem key={item.name} item={item} />)}
          </nav>
        </div>
      </div>

      {/* Bottom Profile */}
      <div className="p-4 border-t border-slate-100">
        <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-slate-50", isCollapsed ? "justify-center" : "")}>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
            <User size={16} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          )}
        </div>
        <Button 
          onClick={() => signOut()}
          className={cn("mt-2 flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors", isCollapsed ? "justify-center" : "")} variant="ghost"
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}