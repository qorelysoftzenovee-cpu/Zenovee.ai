"use client";

import React from 'react';
import { ToolDefinition } from './types';
import { Pencil, Code, FileText, ImageIcon, Sparkles, ArrowRight, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const iconMap: Record<string, any> = {
  pencil: Pencil,
  code: Code,
  file: FileText,
  image: ImageIcon,
  sparkles: Sparkles,
};

export default function ToolCard({ tool }: { tool: ToolDefinition }) {
  const Icon = iconMap[tool.metadata.icon] || Sparkles;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500">
          <Coins size={12} />
          {tool.creditCost} CREDITS
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{tool.metadata.name}</h3>
      <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-2 leading-relaxed">{tool.metadata.description}</p>
      <Link href={`/tools/${tool.id}`} className="w-full">
        <Button className="w-full bg-slate-50 text-slate-900 hover:bg-blue-600 hover:text-white group-hover:shadow-lg transition-all border-none font-bold">
          Open Tool <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </div>
  );
}