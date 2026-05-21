"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";

/* === STAT CARD === */
export function StatCard({
  label,
  value,
  unit,
  trend,
  icon: Icon,
  highlighted = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { direction: "up" | "down"; value: number };
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  highlighted?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border p-4 md:p-5 transition-all duration-200",
      highlighted
        ? "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/2 shadow-[0_0_20px_-8px_rgba(79,70,229,0.2)] hover:shadow-[0_0_24px_-6px_rgba(79,70,229,0.3)]"
        : "border-border/60 bg-card/50 hover:border-border/80 hover:bg-card/80"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl md:text-3xl font-bold tracking-tight">{value}</span>
            {unit && <span className="text-sm text-muted-foreground/70">{unit}</span>}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium mt-2",
              trend.direction === "up" ? "text-success" : "text-warning"
            )}>
              {trend.direction === "up" ? (
                <ArrowUp size={12} />
              ) : (
                <ArrowDown size={12} />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            highlighted ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
          )}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}

/* === PROGRESS CARD === */
export function ProgressCard({
  label,
  percentage,
  subtext,
  variant = "default",
  showPercentage = true,
}: {
  label: string;
  percentage: number;
  subtext?: string;
  variant?: "default" | "success" | "warning" | "danger";
  showPercentage?: boolean;
}) {
  const variantColors = {
    default: {
      bg: "bg-primary/10",
      bar: "bg-gradient-to-r from-primary to-accent",
      text: "text-primary",
    },
    success: {
      bg: "bg-success/10",
      bar: "bg-success",
      text: "text-success",
    },
    warning: {
      bg: "bg-warning/10",
      bar: "bg-warning",
      text: "text-warning",
    },
    danger: {
      bg: "bg-danger/10",
      bar: "bg-danger",
      text: "text-danger",
    },
  };

  const colors = variantColors[variant];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        {showPercentage && <span className={cn("text-sm font-semibold", colors.text)}>{percentage}%</span>}
      </div>
      <div className={cn("relative h-2 w-full overflow-hidden rounded-full", colors.bg)}>
        <div
          className={cn("absolute inset-y-0 left-0 transition-all duration-500 ease-out", colors.bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {subtext && <p className="text-xs text-muted-foreground/70">{subtext}</p>}
    </div>
  );
}

/* === INFO PANEL === */
export function InfoPanel({
  icon: Icon,
  title,
  description,
  content,
  action,
  variant = "info",
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  content?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error";
}) {
  const variantStyles = {
    info: "border-primary/20 bg-primary/5",
    success: "border-success/20 bg-success/5",
    warning: "border-warning/20 bg-warning/5",
    error: "border-danger/20 bg-danger/5",
  };

  const variantTextColors = {
    info: "text-primary",
    success: "text-success",
    warning: "text-warning",
    error: "text-danger",
  };

  return (
    <div className={cn("rounded-xl border p-4 md:p-5 space-y-3", variantStyles[variant])}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn("mt-0.5", variantTextColors[variant])}>
            <Icon size={20} />
          </div>
        )}
        <div className="flex-1">
          <h3 className={cn("font-semibold text-sm", variantTextColors[variant])}>{title}</h3>
          {description && <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>}
        </div>
      </div>
      {content && <div className="text-sm text-muted-foreground/80 space-y-2">{content}</div>}
      {action && <div className="pt-2 border-t border-current/10">{action}</div>}
    </div>
  );
}

/* === FEATURE CARD === */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  isNew = false,
  isPopular = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  badge?: string;
  isNew?: boolean;
  isPopular?: boolean;
}) {
  return (
    <div className={cn(
      "relative rounded-2xl border p-5 md:p-6 transition-all duration-200 ease-out",
      isPopular
        ? "border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 shadow-[0_0_20px_-8px_rgba(79,70,229,0.25)] hover:shadow-[0_0_28px_-6px_rgba(79,70,229,0.35)]"
        : "border-border/60 bg-card/50 hover:border-border/80 hover:bg-card"
    )}>
      {isNew && (
        <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
          New
        </div>
      )}
      {isPopular && (
        <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold uppercase tracking-wider">
          Popular
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          isPopular ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
        )}>
          <Icon size={20} />
        </div>
        {badge && (
          <span className="premium-label ml-auto">{badge}</span>
        )}
      </div>
      <h3 className="font-semibold text-sm md:text-base tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground/70 mt-2 leading-relaxed">{description}</p>
    </div>
  );
}

/* === TIMELINE ITEM === */
export function TimelineItem({
  title,
  description,
  timestamp,
  status = "completed",
  icon: Icon,
}: {
  title: string;
  description?: string;
  timestamp: string;
  status?: "completed" | "pending" | "active";
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const statusClasses = {
    completed: "bg-success/10 border-success/20 text-success",
    pending: "bg-muted border-border/60 text-muted-foreground",
    active: "bg-primary/10 border-primary/20 text-primary",
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border",
          statusClasses[status]
        )}>
          {Icon ? <Icon size={16} /> : null}
        </div>
        <div className="mt-2 h-12 w-px bg-border/60" />
      </div>
      <div className="pb-8">
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground/70 mt-1">{timestamp}</p>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground/80 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}

/* === USAGE METER === */
export function UsageMeter({
  label,
  used,
  total,
  unit = "credits",
  showPercentage = true,
}: {
  label: string;
  used: number;
  total: number;
  unit?: string;
  showPercentage?: boolean;
}) {
  const percentage = Math.min((used / total) * 100, 100);
  const isWarning = percentage > 80;
  const isDanger = percentage > 95;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground/70">
          {used} / {total} {unit}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-500 ease-out",
            isDanger ? "bg-danger" : isWarning ? "bg-warning" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className={cn(
          "text-xs font-medium",
          isDanger ? "text-danger" : isWarning ? "text-warning" : "text-muted-foreground"
        )}>
          {Math.round(percentage)}% used
        </div>
      )}
    </div>
  );
}
