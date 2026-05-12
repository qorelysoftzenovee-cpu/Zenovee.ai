"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToolDefinition } from '../types';
import { executeToolAction } from '../engine/executor';
import { Sparkles, Loader2, Copy, Check, Info, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ToolInterface({ tool }: { tool: ToolDefinition }) {
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRun = async () => {
    setIsLoading(true);
    setError(null);
    const result = await executeToolAction(tool.id, formData, "user_123");
    
    if (result.error) {
      if (result.error === "INSUFFICIENT_CREDITS") {
        setError("Insufficient credits. Please upgrade your plan.");
        // Optionally, trigger an upgrade modal or redirect
        // router.push('/dashboard/billing'); 
      } else {
        setError(result.error);
      }
    } else {
      setOutput(result.data);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{tool.icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{tool.name}</h1>
            <p className="text-sm text-slate-500">{tool.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">
          <Zap size={14} className="text-blue-500 fill-blue-500" />
          Cost: {tool.creditCost} Credits
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left: Inputs */}
        <div className="w-full lg:w-5/12 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-400 uppercase tracking-widest">Input Parameters</div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {tool.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{field.label}</label>
                {field.type === 'select' ? (
                  <select 
                    onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="">Select option...</option>
                    {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea 
                    placeholder={field.placeholder}
                    onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                    className="w-full p-3 h-32 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                ) : (
                  <input 
                    type="text" 
                    placeholder={field.placeholder}
                    onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                )}
              </div>
            ))}
            {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{error}</div>}
          </div>
          <div className="p-6 border-t border-slate-100">
            <button 
              onClick={handleRun}
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} />}
              {isLoading ? "Generating..." : "Run AI Tool"}
            </button>
          </div>
        </div>

        {/* Right: Structured Output */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generated Result</span>
            {output && (
              <button className="text-blue-600 flex items-center gap-1 text-xs font-bold hover:bg-blue-50 px-2 py-1 rounded">
                <Copy size={14} /> Copy All
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            {!output && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Info size={40} className="mb-4 opacity-20" />
                <p className="text-sm">Configure inputs and run the tool to see results.</p>
              </div>
            )}
            {isLoading && <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-slate-100 rounded w-1/3" />
              <div className="h-4 bg-slate-50 rounded w-full" />
              <div className="h-4 bg-slate-50 rounded w-full" />
            </div>}
            {output && <div className="prose prose-slate max-w-none"><pre className="text-xs bg-slate-50 p-4 rounded-lg overflow-x-auto">{JSON.stringify(output, null, 2)}</pre></div>}
          </div>
        </div>
      </div>
    </div>
  );
}