"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles, Loader2 } from "lucide-react";

/* === GENERATION THINKING STATE === */
export function GenerationThinking({ message = "Analyzing context..." }: { message?: string }) {
  return (
    <div className="generation-thinking">
      <div className="flex items-center gap-3">
        <div className="relative h-5 w-5">
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <Sparkles className="absolute inset-0.5 h-4 w-4 text-primary/60 animate-pulse" />
        </div>
        <span className="text-sm font-medium text-primary">{message}</span>
      </div>
    </div>
  );
}

/* === GENERATION PROGRESS === */
export function GenerationProgress({ 
  stages = [],
  currentStage = 0,
  progress = 0,
}: { 
  stages?: string[];
  currentStage?: number;
  progress?: number;
}) {
  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="generation-progress">
        <div 
          className="generation-progress-bar" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stages */}
      {stages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stages.map((stage, idx) => (
            <div
              key={stage}
              className={cn(
                "generation-stage",
                idx <= currentStage && "active"
              )}
            >
              {idx < currentStage ? (
                <CheckCircle2 size={14} className="text-success" />
              ) : idx === currentStage ? (
                <Loader2 size={14} className="animate-spin text-primary" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-border/60 bg-muted/30" />
              )}
              <span>{stage}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* === STREAMING OUTPUT CONTAINER === */
export function StreamingContainer({ 
  children,
  isLoading = false,
}: { 
  children: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className={cn(
      "space-y-3 rounded-xl border border-border/60 bg-gradient-to-br from-card/50 to-background/30 p-4 md:p-5",
      isLoading && "animate-pulse"
    )}>
      {children}
    </div>
  );
}

/* === INSIGHT HIGHLIGHT CARD === */
export function InsightHighlight({ 
  title,
  children,
  variant = "info",
}: { 
  title: string;
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "insight";
}) {
  const variantStyles = {
    info: "border-primary/20 bg-primary/5 text-primary",
    success: "border-success/20 bg-success/5 text-success",
    warning: "border-warning/20 bg-warning/5 text-warning",
    insight: "border-accent/20 bg-accent/5 text-accent",
  };

  return (
    <div className={cn("rounded-xl border p-3 md:p-4", variantStyles[variant])}>
      <h4 className="text-sm font-semibold tracking-tight mb-1.5">{title}</h4>
      <div className="text-sm leading-relaxed opacity-90">
        {children}
      </div>
    </div>
  );
}

/* === OUTPUT SECTION HEADER === */
export function OutputSectionHeader({ 
  title,
  icon: Icon,
  action,
}: { 
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
            <Icon size={16} />
          </div>
        )}
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      {action}
    </div>
  );
}

/* === EMPTY STATE === */
export function EmptyState({ 
  icon: Icon,
  title,
  description,
  action,
}: { 
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={24} />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
      </div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

/* === SKELETON LOADER === */
export function SkeletonLoader({ 
  lines = 3,
  className,
}: { 
  lines?: number;
  className?: string;
}) {
  const widths = React.useMemo(
    () => Array.from({ length: lines }, (_, i) => 72 + ((i * 11) % 24)),
    [lines]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {widths.map((width, i) => (
        <div
          key={i}
          className="loading-skeleton h-4 rounded"
          style={{
            width: `${width}%`,
            backgroundSize: "200% 100%",
          }}
        />
      ))}
    </div>
  );
}

/* === PREMIUM CONTENT CARD === */
export function PremiumContentCard({ 
  title,
  subtitle,
  children,
  action,
  highlighted = false,
}: { 
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border bg-card p-5 md:p-6 transition-all duration-200",
      highlighted 
        ? "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/2 shadow-[0_0_20px_-8px_rgba(79,70,229,0.2)]"
        : "border-border/60 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)]"
    )}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="text-sm text-muted-foreground space-y-2">
        {children}
      </div>
    </div>
  );
}

/* === METRIC HIGHLIGHT === */
export function MetricHighlight({ 
  label,
  value,
  unit,
  trend,
}: { 
  label: string;
  value: string | number;
  unit?: string;
  trend?: { direction: "up" | "down"; value: string };
}) {
  return (
    <div className="metric-highlight">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {trend && (
        <div className={cn(
          "mt-2 text-xs font-medium",
          trend.direction === "up" ? "text-success" : "text-warning"
        )}>
          {trend.direction === "up" ? "↑" : "↓"} {trend.value}
        </div>
      )}
    </div>
  );
}

/* === PREMIUM DIVIDER === */
export function PremiumDivider({ label }: { label?: string }) {
  return (
    <div className="section-divider">
      {label && (
        <span className="px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}

/* === ANIMATED COUNTER === */
export function AnimatedCounter({ 
  from = 0,
  to,
  duration = 1000,
}: { 
  from?: number;
  to: number;
  duration?: number;
}) {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(from + (to - from) * progress));
    }, 16);

    return () => clearInterval(interval);
  }, [from, to, duration]);

  return <span>{count}</span>;
}

/* === COPY INDICATOR === */
export function CopyIndicator({ 
  copied = false,
}: { 
  copied?: boolean;
}) {
  if (copied) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success animate-enter">
        <CheckCircle2 size={14} />
        Copied
      </div>
    );
  }
  return null;
}

/* === GENERATION HEADER === */
export function GenerationHeader({ 
  title,
  timestamp,
  status,
}: { 
  title: string;
  timestamp?: Date;
  status?: "generating" | "complete" | "error";
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h2>
        {timestamp && (
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
      {status && (
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          status === "generating" && "bg-primary/10 text-primary animate-pulse",
          status === "complete" && "bg-success/10 text-success",
          status === "error" && "bg-danger/10 text-danger"
        )}>
          {status === "generating" ? "Generating..." : status === "complete" ? "Complete" : "Error"}
        </div>
      )}
    </div>
  );
}
