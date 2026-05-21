"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Lightbulb, TrendingUp, Clock, Target, Zap, ChevronRight } from "lucide-react";

/* === SMART SUGGESTION === */
export function SmartSuggestion({
  title,
  description,
  icon: Icon = Sparkles,
  action,
  actionLabel = "Apply",
  variant = "info",
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action?: () => void;
  actionLabel?: string;
  variant?: "info" | "opportunity" | "optimization" | "insight";
}) {
  const variantStyles = {
    info: {
      bg: "bg-primary/5 border-primary/20",
      icon: "bg-primary/10 text-primary",
      label: "bg-primary/20 text-primary",
    },
    opportunity: {
      bg: "bg-accent/5 border-accent/20",
      icon: "bg-accent/10 text-accent",
      label: "bg-accent/20 text-accent",
    },
    optimization: {
      bg: "bg-warning/5 border-warning/20",
      icon: "bg-warning/10 text-warning",
      label: "bg-warning/20 text-warning",
    },
    insight: {
      bg: "bg-success/5 border-success/20",
      icon: "bg-success/10 text-success",
      label: "bg-success/20 text-success",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn(
      "rounded-xl border p-4 md:p-5 transition-all duration-200 ease-out hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)]",
      styles.bg
    )}>
      <div className="flex items-start gap-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", styles.icon)}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
        </div>
        {action && (
          <button
            onClick={action}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
              styles.label,
              "hover:opacity-80"
            )}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* === CONTEXTUAL SUGGESTION BANNER === */
export function ContextualSuggestion({
  title,
  description,
  action,
  actionLabel = "Learn more",
  onDismiss,
  icon: Icon = Lightbulb,
}: {
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  onDismiss?: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/5 p-4 md:p-5 animate-enter">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0 mt-0.5">
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {action && (
            <button
              onClick={action}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors duration-200"
            >
              {actionLabel}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors duration-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* === RECENT ACTIVITY ITEM === */
export function RecentActivityItem({
  title,
  description,
  timestamp,
  icon: Icon,
  action,
  actionLabel = "View",
}: {
  title: string;
  description?: string;
  timestamp: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200 group">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium group-hover:text-primary transition-colors duration-200">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{description}</p>
        )}
        <p className="text-xs text-muted-foreground/50 mt-1">{timestamp}</p>
      </div>
      {action && (
        <button
          onClick={action}
          className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors duration-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* === ADAPTIVE DEFAULTS DISPLAY === */
export function AdaptiveDefaults({
  presets,
  selectedPreset,
  onSelectPreset,
}: {
  presets: { id: string; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];
  selectedPreset?: string;
  onSelectPreset?: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Recommended for you</p>
      <div className="grid gap-2">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset?.(preset.id)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 text-left",
                isSelected
                  ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 hover:border-border/80 hover:bg-muted/30"
              )}
            >
              <Icon size={16} className={cn(
                "mt-0.5 shrink-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{preset.label}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{preset.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* === QUICK ACTION BUTTON === */
export function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
  variant = "default",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "hover:bg-primary/10 text-primary",
    success: "hover:bg-success/10 text-success",
    warning: "hover:bg-warning/10 text-warning",
    danger: "hover:bg-danger/10 text-danger",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border/60 p-3 text-left transition-all duration-200",
        variantStyles[variant]
      )}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {description && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{description}</p>
        )}
      </div>
      <ChevronRight size={14} className="shrink-0 mt-0.5 opacity-50" />
    </button>
  );
}

/* === WORKFLOW AWARENESS === */
export function WorkflowAwareness({
  currentStep,
  steps,
  onStepClick,
}: {
  currentStep: number;
  steps: { id: string; label: string; description?: string; completed?: boolean }[];
  onStepClick?: (stepIndex: number) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Your workflow</p>
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isCompleted = step.completed === true || idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <button
              key={step.id}
              onClick={() => onStepClick?.(idx)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200 w-full",
                isActive
                  ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                  : isCompleted
                  ? "border-success/20 bg-success/5"
                  : "border-border/60 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold shrink-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                  ? "bg-success/20 text-success"
                  : "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? "✓" : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-medium", isActive ? "text-primary" : "text-foreground")}>{step.label}</p>
                {step.description && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{step.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* === SAVED ASSETS DISPLAY === */
export function SavedAssetCard({
  title,
  description,
  timestamp,
  tags,
  onOpen,
  onDelete,
}: {
  title: string;
  description?: string;
  timestamp: string;
  tags?: string[];
  onOpen?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4 md:p-5 transition-all duration-200 hover:border-border/80 hover:bg-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate hover:text-primary transition-colors duration-200 cursor-pointer" onClick={onOpen}>{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex px-2 py-1 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground/70">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground/60">{timestamp}</p>
        <div className="flex items-center gap-2">
          {onOpen && (
            <button
              onClick={onOpen}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors duration-200"
            >
              Open
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors duration-200"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
