"use client";

import React, { useState, useMemo } from 'react';
import { ToolDefinition } from './types';
import { Play, Copy, Download, Share2, ArrowLeft, RefreshCw, Zap, Check, FileText, Layout, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ToolView({ tool }: { tool: ToolDefinition }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [output, setOutput] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('result');

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const outputSections = useMemo(() => {
    if (!output || typeof output !== 'object') return null;
    return Object.entries(output);
  }, [output]);

  const handleExecute = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    
    try {
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        body: JSON.stringify({ toolId: tool.id, input: formData }),
      });
      
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setOutput(result.output || result);
    } catch (error) {
      console.error("Execution failed", error);
      setOutput({ error: "Failed to connect to AI engine. Check API configuration." });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = () => {
    const text = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    const content = output?.fullArticle || output?.content_markdown || JSON.stringify(output, null, 2);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}-generation.md`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/tools">
            <Button variant="ghost" size="icon" className="text-slate-500"><ArrowLeft size={20} /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{tool.metadata.name}</h1>
            <p className="text-sm text-slate-500">{tool.metadata.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
          <Zap size={14} className="fill-blue-700" />
          {tool.aiModel.split('-').slice(1).join(' ').toUpperCase()}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {/* LEFT: Input Panel */}
        <div className="flex flex-col gap-6 bg-white rounded-2xl border border-slate-200 p-8 overflow-y-auto shadow-sm">
          <div className="space-y-6">
            {tool.fields.map(field => (
              <div key={field.name} className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{field.label}</label>
                {field.type === 'file' ? (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Download size={24} className="text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500">Click to upload image</p>
                      </div>
                      <input type="file" className="hidden" onChange={(e) => handleInputChange(field.name, "file-staged")} />
                    </label>
                  </div>
                ) : field.type === 'textarea' ? (
                  <Textarea 
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="min-h-[200px] border-slate-200 bg-slate-50/50 focus:bg-white resize-none"
                  />
                ) : field.type === 'select' ? (
                  <select 
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500/20"
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : (
                  <Input 
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="border-slate-200 bg-slate-50/50 focus:bg-white"
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400">Cost: <strong>{tool.creditCost} Credits</strong></div>
            <Button 
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-blue-200"
            >
              {isExecuting ? <RefreshCw className="animate-spin mr-2" /> : <Play className="mr-2 fill-white" />}
              {isExecuting ? 'Processing...' : 'Generate Content'}
            </Button>
          </div>
        </div>

        {/* RIGHT: Output Panel */}
        <div className="flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="h-12 bg-slate-800/50 px-6 flex items-center justify-between border-b border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Output</span>
            <div className="flex items-center gap-2">
              <button onClick={copyToClipboard} className="p-1.5 text-slate-400 hover:text-white transition-colors">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
              <button onClick={downloadMarkdown} className="p-1.5 text-slate-400 hover:text-white transition-colors"><Download size={16} /></button>
              <button className="p-1.5 text-slate-400 hover:text-white transition-colors"><Share2 size={16} /></button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {output ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="bg-slate-800/30 px-4 border-b border-slate-700/50">
                  <TabsList className="bg-transparent h-12 gap-4">
                    <TabsTrigger value="result" className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 border-b-2 border-transparent data-[state=active]:border-blue-400 rounded-none px-0 h-full">Structured</TabsTrigger>
                    <TabsTrigger value="raw" className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 border-b-2 border-transparent data-[state=active]:border-blue-400 rounded-none px-0 h-full">Source</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-8 scrollbar-dark">
                  <TabsContent value="result" className="mt-0 outline-none">
                    {typeof output === 'string' ? (
                      <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{output}</p>
                    ) : outputSections ? (
                      <div className="space-y-8">
                        {outputSections.map(([key, value]) => (
                          <div key={key} className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6">
                            <h3 className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                              <FileText size={14} /> {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h3>
                            <div className="text-slate-200 text-sm leading-relaxed">
                              {Array.isArray(value) ? (
                                <ul className="list-disc list-inside space-y-2">
                                  {value.map((item, idx) => <li key={idx}>{String(item)}</li>)}
                                </ul>
                              ) : typeof value === 'object' ? (
                                <pre className="bg-slate-900/50 p-4 rounded-lg overflow-x-auto text-xs">{JSON.stringify(value, null, 2)}</pre>
                              ) : (
                                <p className="whitespace-pre-wrap">{String(value)}</p>
                              )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
                                <button 
                                  onClick={() => navigator.clipboard.writeText(String(value))}
                                  className="text-[10px] font-bold text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                                >
                                  <Copy size={12} /> COPY SECTION
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                       <pre className="text-blue-300 text-xs">{JSON.stringify(output, null, 2)}</pre>
                    )}
                  </TabsContent>
                  <TabsContent value="raw" className="mt-0 outline-none">
                    <pre className="text-blue-300 text-xs font-mono">{JSON.stringify(output, null, 2)}</pre>
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                {isExecuting ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
                    <p className="text-sm font-medium">Gemini is thinking...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                      <Zap size={24} className="text-slate-700" />
                    </div>
                    <p className="font-medium">Run the tool to see results</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}