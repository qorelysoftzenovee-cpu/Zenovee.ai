"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

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

function renderMarkdownLike(content: string) {
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  const blocks: ReactNode[] = [];

  const flushCodeBlock = (key: string) => {
    if (codeBuffer.length === 0) return;
    blocks.push(
      <pre key={key} className="overflow-x-auto rounded-lg border border-border/70 bg-muted/30 p-3 text-xs leading-6 text-foreground">
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
      blocks.push(<h3 key={index} className="text-base font-semibold">{line.replace(/^###\s+/, "")}</h3>);
      return;
    }
    if (/^##\s+/.test(line)) {
      blocks.push(<h2 key={index} className="text-lg font-semibold">{line.replace(/^##\s+/, "")}</h2>);
      return;
    }
    if (/^#\s+/.test(line)) {
      blocks.push(<h1 key={index} className="text-xl font-semibold">{line.replace(/^#\s+/, "")}</h1>);
      return;
    }
    if (/^-\s+/.test(line)) {
      blocks.push(<p key={index} className="pl-4">• {line.replace(/^-\s+/, "")}</p>);
      return;
    }
    if (/^\d+\.\s+/.test(line)) {
      blocks.push(<p key={index} className="pl-4">{line}</p>);
      return;
    }
    blocks.push(<p key={index}>{line || "\u00A0"}</p>);
  });

  if (inCodeBlock) {
    flushCodeBlock("code-eof");
  }

  return (
    <div className="space-y-2 text-sm leading-7 text-foreground">
      {blocks}
    </div>
  );
}

export function OutputRenderer({ value, className }: OutputRendererProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const content = toDisplayString(value);
  if (!content) {
    return <p className="text-sm text-muted-foreground">No output yet.</p>;
  }

  if (isPremiumEnvelope(value)) {
    return (
      <div className={className}>
        <div className="mb-3 rounded-xl border bg-card p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">{value.title}</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(JSON.stringify(value.raw, null, 2));
                setCopied("all");
                setTimeout(() => setCopied(null), 1200);
              }}
            >
              {copied === "all" ? "Copied" : "Copy all"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{value.summary}</p>
        </div>

        <div className="grid gap-3">
          {value.sections.map((section) => (
            <details key={section.id} className="group rounded-xl border border-border bg-card p-0 transition-shadow hover:shadow-lg">
              <summary className="flex items-center justify-between gap-3 rounded-t-xl px-4 py-3 text-sm font-semibold text-foreground outline-none cursor-pointer bg-background/80 transition">
                <span>{section.heading}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition duration-300 group-open:-rotate-180" />
              </summary>
              <div className="space-y-4 border-t border-border/70 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  {section.bullets && section.bullets.length > 0 ? (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      {section.bullets.length} key points
                    </span>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(section.body);
                      setCopied(section.id);
                      setTimeout(() => setCopied(null), 1200);
                    }}
                  >
                    {copied === section.id ? "Copied" : "Copy"}
                  </Button>
                </div>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="space-y-2 text-sm leading-7 text-foreground pl-5 list-disc">
                    {section.bullets.map((bullet, idx) => (
                      <li key={`${section.id}-${idx}`}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {isMarkdownLike(section.body) ? renderMarkdownLike(section.body) : <pre className="whitespace-pre-wrap rounded-2xl bg-muted/10 p-4 text-sm leading-7 text-foreground">{section.body}</pre>}
              </div>
            </details>
          ))}
        </div>
      </div>
    );
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div className={className}>
        <div className="grid gap-3">
          {entries.map(([key, section]) => {
            const sectionText = toDisplayString(section);
            return (
              <div key={key} className="rounded-xl border bg-card p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold capitalize">{key.replace(/([A-Z])/g, " $1")}</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(sectionText);
                      setCopied(key);
                      setTimeout(() => setCopied(null), 1200);
                    }}
                  >
                    {copied === key ? "Copied" : "Copy"}
                  </Button>
                </div>
                {isMarkdownLike(sectionText) ? renderMarkdownLike(sectionText) : <pre className="whitespace-pre-wrap text-sm leading-7 text-foreground">{sectionText}</pre>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {isMarkdownLike(content) ? (
        renderMarkdownLike(content)
      ) : (
        <pre className="whitespace-pre-wrap text-sm leading-7 text-foreground">{content}</pre>
      )}
    </div>
  );
}
