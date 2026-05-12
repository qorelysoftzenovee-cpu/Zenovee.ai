"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Sidebar from './sidebar';
import { Search, Bell, Zap, Menu } from 'lucide-react';
import { getUserCredits } from './actions'; // Assuming an action to get user credits

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<number | null>(null);

  if (status === "unauthenticated") {
    redirect("/login");
  }

  useEffect(() => {
    if (!session?.user) return;
    const fetchCredits = async () => {
      setCredits(2450); // Replace with real credits fetch logic using session.user.id
    };
    fetchCredits();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50/50">
      {session?.user && <Sidebar user={session.user} />}
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-20">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search tools, history or documentation..." 
              className="w-full bg-slate-50 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
              <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span className="text-xs font-bold text-blue-700">{credits !== null ? credits.toLocaleString() : '...'} Credits Left</span>
            </div>
            
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}