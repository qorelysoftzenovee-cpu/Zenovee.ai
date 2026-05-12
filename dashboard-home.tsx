"use client";

import React from 'react';
import { ArrowUpRight, Clock, Star, LayoutGrid } from 'lucide-react';
import { listToolDefinitions } from './definitions';
import ToolCard from './tool-card';

export default function DashboardHome() {
  const tools = listToolDefinitions();
  const stats = [
    { label: 'Total Executions', value: '1,284', change: '+12%', color: 'text-green-600' },
    { label: 'Credits Used', value: '14,200', change: '+5%', color: 'text-blue-600' },
    { label: 'Time Saved', value: '42h', change: '+18%', color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, Abdul</h1>
          <p className="text-slate-500">Here's what's happening with your AI workstation today.</p>
        </div>
        <div className="flex gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-w-[160px]">
              <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold text-slate-900">{stat.value}</span>
                <span className={`text-[10px] font-bold ${stat.color} flex items-center`}>
                  {stat.change} <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Used */}
      <section>
        <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
          <Clock size={18} className="text-blue-600" />
          <h2>Recently Used Tools</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.slice(0, 3).map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Popular Tools */}
      <section>
        <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
          <Star size={18} className="text-yellow-500" />
          <h2>Popular This Week</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...tools].reverse().slice(0, 3).map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section>
        <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
          <LayoutGrid size={18} className="text-purple-600" />
          <h2>Explore Categories</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {['Content', 'SEO', 'Image', 'Social', 'Code', 'Marketing'].map(cat => (
            <div key={cat} className="group cursor-pointer bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 transition-colors">
                <FolderIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{cat}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}