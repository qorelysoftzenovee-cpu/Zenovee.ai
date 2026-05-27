"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown, Clipboard, FileText, Sparkles } from "lucide-react";

type OutputRendererProps = {
  value: unknown;
  className?: string;
};

type PremiumSection = {
  id: string;
  heading: string;
  body: string;
  bullets?: string[];
};

type PremiumOutputEnvelope = {
  version: "v2";
  title: string;
  summary: string;
  sections: PremiumSection[];
  raw: Record<string, unknown>;
  actions?: { copy?: boolean; export?: boolean; regenerate?: boolean; improve?: boolean };
};

function isPremiumEnvelope(value: unknown): value is PremiumOutputEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return candidate.version === "v2" && typeof candidate.title === "string" && Array.isArray(candidate.sections);
}

function toDisplayString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function isMarkdownLike(content: string): boolean {
  return /(^|\n)#{1,4}\s|(^|\n)-\s|\*\*.+\*\*|(^|\n)\d+\.\s|```/m.test(content);
}

function formatOutputLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim();
}

function CopyButton({ value, copied, onCopied, label = "Copy" }: { value: string; copied: boolean; onCopied: () => void; label?: string }) {
  return (
    <Button
      size="sm"
      variant={copied ? "secondary" : "outline"}
      className="h-8 rounded-full px-3 text-xs"
      onClick={async () => {
        if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
          return;
        }

        try {
          await navigator.clipboard.writeText(value);
          onCopied();
        } catch {
          // Ignore clipboard failures so output rendering never crashes.
        }
      }}
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function renderMarkdownLike(content: string) {
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  const blocks: ReactNode[] = [];

  const flushCodeBlock = (key: string) => {
    if (codeBuffer.length === 0) return;
    blocks.push(
      <pre key={key} className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-950 p-4 text-xs leading-6 text-slate-100 shadow-inner">
        {codeBuffer.join("\n")}
      </pre>
    );
    codeBuffer = [];
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock(`code-${index}`);
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (/^###\s+/.test(line)) {
      blocks.push(<h3 key={index} className="pt-2 text-base font-semibold tracking-tight text-slate-950 dark:text-white">{line.replace(/^###\s+/, "")}</h3>);
      return;
    }
    if (/^##\s+/.test(line)) {
      blocks.push(<h2 key={index} className="pt-3 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{line.replace(/^##\s+/, "")}</h2>);
      return;
    }
    if (/^#\s+/.test(line)) {
      blocks.push(<h1 key={index} className="pt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{line.replace(/^#\s+/, "")}</h1>);
      return;
    }
    if (/^-\s+/.test(line)) {
      blocks.push(
        <div key={index} className="flex gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <p>{line.replace(/^-\s+/, "")}</p>
        </div>
      );
      return;
    }
    if (/^\d+\.\s+/.test(line)) {
      blocks.push(<p key={index} className="rounded-2xl bg-slate-50 px-4 py-2 text-slate-700 dark:bg-white/5 dark:text-slate-200">{line}</p>);
      return;
    }
    blocks.push(<p key={index} className="text-slate-700 dark:text-slate-200">{line || "\u00A0"}</p>);
  });

  if (inCodeBlock) {
    flushCodeBlock("code-eof");
  }

  return (
    <div className="space-y-3 text-sm leading-7">
      {blocks}
    </div>
  );
}

export function OutputRenderer({ value, className }: OutputRendererProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const content = toDisplayString(value);
  const markCopied = (id: string) => {
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  if (!content) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-primary shadow-2xl shadow-primary/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-base font-semibold text-white">Your premium output will appear here</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
          Fill the builder, run the tool, and review a polished, copy-ready response with export options.
        </p>
      </div>
    );
  }

  if (isPremiumEnvelope(value)) {
    return (
      <div className={className}>
        <div className="mb-4 overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/12 via-white/8 to-white/5 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Premium result
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-white">{value.title}</h3>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">{value.summary}</p>
            </div>
            <CopyButton value={JSON.stringify(value.raw, null, 2)} copied={copied === "all"} onCopied={() => markCopied("all")} label="Copy all" />
          </div>
        </div>

        <div className="grid gap-4">
          {value.sections.map((section, index) => (
            <details key={section.id} open={index === 0} className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10 transition hover:border-primary/40 hover:bg-white/[0.06]">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-white outline-none transition">
                <span className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">{index + 1}</span>
                  {section.heading}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400 transition duration-300 group-open:-rotate-180" />
              </summary>
              <div className="space-y-4 border-t border-white/10 bg-white/[0.03] px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  {section.bullets && section.bullets.length > 0 ? (
                    <span className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      {section.bullets.length} key points
                    </span>
                  ) : null}
                  <CopyButton value={section.body} copied={copied === section.id} onCopied={() => markCopied(section.id)} />
                </div>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="grid gap-2 text-sm leading-7 text-slate-200">
                    {section.bullets.map((bullet, idx) => (
                      <li key={`${section.id}-${idx}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.96] p-4 text-slate-900 shadow-inner dark:bg-slate-950/70 dark:text-slate-100">
                  {isMarkdownLike(section.body) ? renderMarkdownLike(section.body) : <pre className="whitespace-pre-wrap text-sm leading-7">{section.body}</pre>}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    );
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>).filter(([key]) => key !== "raw");

    if (entries.length === 0) {
      return (
        <div className={className}>
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="flex size-8 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                Generated response
              </div>
              <CopyButton value={content} copied={copied === "content"} onCopied={() => markCopied("content")} />
            </div>
            <div className="bg-white/[0.96] p-5 text-slate-900 dark:bg-slate-950/70 dark:text-slate-100">
              <pre className="whitespace-pre-wrap text-sm leading-7">{content}</pre>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={className}>
        <div className="grid gap-4">
          {entries.map(([key, section]) => {
            const sectionText = toDisplayString(section);
            return (
              <div key={key} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <h4 className="text-sm font-semibold capitalize text-white">{formatOutputLabel(key)}</h4>
                  </div>
                  <CopyButton value={sectionText} copied={copied === key} onCopied={() => markCopied(key)} />
                </div>
                <div className="bg-white/[0.96] p-5 text-slate-900 dark:bg-slate-950/70 dark:text-slate-100">
                  {isMarkdownLike(sectionText) ? renderMarkdownLike(sectionText) : <pre className="whitespace-pre-wrap text-sm leading-7">{sectionText}</pre>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3 text-sm font-semibold text-white">
            <span className="flex size-8 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            Generated response
          </div>
          <CopyButton value={content} copied={copied === "content"} onCopied={() => markCopied("content")} />
        </div>
        <div className="bg-white/[0.96] p-5 text-slate-900 dark:bg-slate-950/70 dark:text-slate-100">
          {isMarkdownLike(content) ? renderMarkdownLike(content) : <pre className="whitespace-pre-wrap text-sm leading-7">{content}</pre>}
        </div>
      </div>
    </div>
  );
}
