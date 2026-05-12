"use client";

import React from 'react';
import { Copy, Download, Share2, Sparkles, ChevronLeft, Upload, Info } from 'lucide-react';

export default function ToolExperience() {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-in zoom-in-95 duration-500">
      {/* Tool Header */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">WR</div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">SEO Article Writer</h1>
          <p className="text-xs text-slate-400">Generate long-form articles optimized for search engines.</p>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left: Input Panel */}
        <div className="w-full lg:w-5/12 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Input Parameters</span>
            <Info size={14} className="text-slate-300" />
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Primary Keyword</label>
              <input type="text" placeholder="e.g. Artificial Intelligence" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Writing Tone</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                <option>Professional</option>
                <option>Creative</option>
                <option>Witty</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Reference Material (Optional)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="text-slate-300" size={24} />
                <p className="text-xs text-slate-500">Drag files or click to upload PDF/TXT</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-blue-700">Include Semantic Keywords</span>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-blue-600" checked readOnly />
            </div>
          </div>
          <div className="p-4 border-t border-slate-100">
            <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
              <Sparkles size={18} />
              Generate Article
            </button>
          </div>
        </div>

        {/* Right: Output Panel */}
        <div className="hidden lg:flex flex-1 bg-slate-900 rounded-2xl flex-col shadow-2xl relative overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">AI Generation</span>
            <div className="flex gap-2">
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Copy size={16} /></button>
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Download size={16} /></button>
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Share2 size={16} /></button>
            </div>
          </div>
          <div className="flex-1 p-8 overflow-y-auto prose prose-invert max-w-none">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-white/10 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-2/3" />
              <div className="h-32 bg-white/5 rounded w-full mt-8" />
            </div>
            <p className="text-white/20 font-mono text-sm mt-8 absolute inset-0 flex items-center justify-center pointer-events-none">
              Awaiting Input...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}