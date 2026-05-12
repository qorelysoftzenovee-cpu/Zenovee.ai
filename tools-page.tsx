"use client";

import React, { useState } from 'react';
import { listToolDefinitions } from './definitions';
import ToolCard from './tool-card';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ToolsPage() {
  const [search, setSearch] = useState("");
  const tools = listToolDefinitions();
  
  const categories = ["All", ...new Set(tools.map(t => t.metadata.category))];

  const filteredTools = tools.filter(t => 
    t.metadata.name.toLowerCase().includes(search.toLowerCase()) ||
    t.metadata.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900">AI Tool Directory</h1>
        <p className="text-slate-500">Access our entire suite of professional-grade AI models.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-full md:max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..." 
            className="pl-10 border-slate-200 focus:bg-white bg-slate-50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Tabs defaultValue="All" className="w-full">
            <TabsList className="bg-slate-100 p-1">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredTools.length > 0 ? (
          filteredTools.map(tool => <ToolCard key={tool.id} tool={tool} />)
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 font-medium">No tools found matching your search.</div>
        )}
      </div>
    </div>
  );
}