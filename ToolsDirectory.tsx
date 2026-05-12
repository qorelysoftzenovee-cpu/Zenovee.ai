"use client";

import React, { useState } from 'react';
import { Search, Filter, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function ToolsDirectory() {
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Tools Library</h1>
          <p className="text-slate-500 mt-1">Access 50+ specialized AI models for your workflow.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for a tool (e.g. 'Article', 'Logo', 'Python')..." 
              className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', 'Content', 'Social Media', 'Design', 'Development', 'Business', 'SEO'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === cat 
              ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
              : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl group-hover:bg-blue-50 transition-colors">
                {i % 2 === 0 ? '📝' : '⚡'}
              </div>
              <div className="px-2 py-1 bg-green-50 text-[10px] font-bold text-green-600 rounded uppercase tracking-tighter">
                Optimized
              </div>
            </div>
            
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Content Rewriter Pro</h3>
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">Paraphrase text while maintaining tone and context with high accuracy.</p>
            
            <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">3 Credits / req</span>
              <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                Open Tool
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}