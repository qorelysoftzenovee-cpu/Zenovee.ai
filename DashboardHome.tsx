"use client";

import React, { useEffect, useState } from 'react';
import { ArrowRight, Star, Clock, Grid } from 'lucide-react';
import { getUserCredits } from './actions'; // Assuming an action to get user credits

export default function DashboardHome() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      // In a real app, this would fetch credits for the logged-in user
      // For now, using a mock value or a server action if user.id is available
      setCredits(2450); // Mock value
    };
    fetchCredits();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, Alex! 👋</h1>
          <p className="text-slate-500 mt-1">You've saved roughly 12 hours this week using Zenovee AI.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-6 py-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Usage</p>
            <p className="text-xl font-bold text-slate-900">
              {credits !== null ? credits.toLocaleString() : '...'}
              <span className="text-sm text-slate-500"> / month</span>
            </p>
            <p className="text-xl font-bold text-slate-900">84%</p>
          </div>
          <div className="text-center px-6 py-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Gen Score</p>
            <p className="text-xl font-bold text-slate-900">9.2</p>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Recently Used</h2>
            <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:border-blue-300 transition-all cursor-pointer group shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">✍️</div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">SEO Blog Post Generator</h3>
                  <p className="text-xs text-slate-500">Last used 2 hours ago</p>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Star size={18} className="text-yellow-500" /> Popular This Week</h2>
            <button className="text-xs font-bold text-blue-600 hover:underline">Explore</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['Image Upscaler', 'Ad Copywriter'].map((name) => (
              <div key={name} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-4">✨</div>
                <h3 className="text-sm font-bold text-slate-900">{name}</h3>
                <p className="text-[10px] text-slate-400 mt-1">Used by 4k+ professionals</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Categories Grid */}
      <section>
        <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-6 px-1"><Grid size={18} className="text-slate-400" /> Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {['Writing', 'Images', 'Video', 'Marketing', 'Code', 'Audio'].map((cat) => (
            <button key={cat} className="bg-white py-4 px-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
              {cat}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}