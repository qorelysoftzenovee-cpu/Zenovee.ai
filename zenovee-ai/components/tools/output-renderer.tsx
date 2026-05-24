"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type OutputRendererProps = {
  value: unknown;
  className?: string;
};

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
