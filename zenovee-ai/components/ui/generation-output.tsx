"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Copy, Download, Sparkles } from "lucide-react";

/* === GENERATION OUTPUT PANEL === */
export function GenerationOutputPanel({
  title,
  isGenerating = false,
  stages = [],
  currentStage = 0,
  progress = 0,
  children,
  onRetry,
  className,
}: {
  title: string;
  isGenerating?: boolean;
  stages?: string[];
  currentStage?: number;
  progress?: number;
  children: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight">{title}</h3>
            {isGenerating && (
              <p className="text-xs text-muted-foreground/70">Generating...</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isGenerating && onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 bg-background hover:bg-muted/70 transition-all duration-200"
            >
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isGenerating && stages.length > 0 && (
        <div className="space-y-2">
          <div className="generation-progress">
            <div 
              className="generation-progress-bar" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {stages.map((stage, idx) => (
              <div
                key={stage}
                className={cn(
                  "generation-stage text-xs",
                  idx <= currentStage && "active"
                )}
              >
                {idx < currentStage ? (
                  <Check size={12} className="text-success" />
                ) : idx === currentStage ? (
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                ) : (
                  <div className="h-2 w-2 rounded-full border border-border/60 bg-muted/30" />
                )}
                {stage}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="animate-enter">{children}</div>
    </div>
  );
}

/* === OUTPUT SECTION === */
export function OutputSection({
  title,
  icon: Icon,
  children,
  actions,
  highlighted = false,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  actions?: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-4 md:p-5 space-y-3 transition-all duration-200",
      highlighted
        ? "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/2 shadow-[0_0_20px_-8px_rgba(79,70,229,0.2)]"
        : "border-border/60 bg-card/50"
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary/70">
              <Icon size={16} />
            </div>
          )}
          <h4 className="font-semibold tracking-tight text-sm">{title}</h4>
        </div>
        {actions}
      </div>
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

/* === COPYABLE OUTPUT BLOCK === */
export function CopyableOutputBlock({
  content,
  label = "Output",
}: {
  content: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        <button
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200",
            copied
              ? "border border-success/30 bg-success/10 text-success"
              : "border border-border/60 bg-background hover:bg-muted/70"
          )}
        >
          {copied ? (
            <>
              <Check size={12} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/30 p-4 text-xs font-mono leading-relaxed text-muted-foreground select-all">
        {content}
      </pre>
    </div>
  );
}

/* === TABBED OUTPUT === */
export function TabbedOutput({
  tabs,
  defaultTab = 0,
}: {
  tabs: { label: string; content: React.ReactNode }[];
  defaultTab?: number;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/60 overflow-x-auto pb-2">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(idx)}
            className={cn(
              "px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2",
              activeTab === idx
                ? "border-primary text-primary bg-primary/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="animate-enter">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
}

/* === EXPANDABLE SECTION === */
export function ExpandableSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full group"
      >
        <h4 className="font-semibold tracking-tight text-sm group-hover:text-primary transition-colors duration-200">
          {title}
        </h4>
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>
      {isOpen && (
        <div className="animate-enter space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* === GENERATION COMPLETE STATE === */
export function GenerationCompleteState({
  title,
  subtitle,
  generatedAt,
  actions,
}: {
  title: string;
  subtitle?: string;
  generatedAt?: Date;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-success/20 bg-gradient-to-br from-success/10 to-success/5 p-6 md:p-8 text-center space-y-4 animate-enter">
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
          <Check size={24} className="text-success" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold tracking-tight text-lg text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {generatedAt && (
        <p className="text-xs text-muted-foreground/70">
          Generated on {generatedAt.toLocaleString()}
        </p>
      )}
      {actions && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/* === STREAMING TEXT DISPLAY === */
export function StreamingText({
  text = "",
  isStreaming = false,
}: {
  text?: string;
  isStreaming?: boolean;
}) {
  return (
    <div className={cn(
      "prose prose-sm dark:prose-invert max-w-none",
      "text-muted-foreground leading-relaxed whitespace-pre-wrap break-words"
    )}>
      {text}
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-primary/70 ml-1 animate-pulse rounded-sm" />
      )}
    </div>
  );
}

/* === GENERATION ERROR STATE === */
export function GenerationError({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-danger/20 bg-gradient-to-br from-danger/10 to-danger/5 p-4 space-y-3">
      <div className="space-y-1">
        <h4 className="font-semibold text-sm text-danger">Generation failed</h4>
        <p className="text-xs text-danger/80">{error}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 transition-all duration-200"
        >
          Try again
        </button>
      )}
    </div>
  );
}
