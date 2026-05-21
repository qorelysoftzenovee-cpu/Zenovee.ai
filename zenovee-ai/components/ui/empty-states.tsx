"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  Zap, 
  FileText, 
  Clock, 
  Settings,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

const EMPTY_STATE_ICONS = {
  generation: Sparkles,
  search: Search,
  guide: BookOpen,
  beta: Zap,
  history: Clock,
  settings: Settings,
  help: HelpCircle,
  insight: Lightbulb,
  document: FileText,
};

type EmptyStateVariant = keyof typeof EMPTY_STATE_ICONS;

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: EmptyStateVariant;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function EmptyStateView({
  title,
  description,
  icon = "generation",
  action,
  secondaryAction,
  size = "md",
}: EmptyStateProps) {
  const Icon = EMPTY_STATE_ICONS[icon];
  
  const sizeClasses = {
    sm: "py-6 md:py-8",
    md: "py-8 md:py-12",
    lg: "py-12 md:py-16",
  };

  return (
    <div className={cn("empty-state", sizeClasses[size])}>
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={size === "lg" ? 32 : size === "md" ? 24 : 20} />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="empty-state-title">{title}</h3>
        {description && (
          <p className="empty-state-description">{description}</p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="empty-state-action">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
            {action}
            {secondaryAction}
          </div>
        </div>
      )}
    </div>
  );
}

/* === ONBOARDING EMPTY STATE === */
export function OnboardingEmptyState({
  title,
  subtitle,
  steps,
  action,
}: {
  title: string;
  subtitle: string;
  steps: { number: number; text: string }[];
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Sparkles size={28} />
      </div>
      <div className="space-y-3">
        <div className="text-center space-y-1">
          <h3 className="empty-state-title">{title}</h3>
          <p className="empty-state-description">{subtitle}</p>
        </div>

        <div className="mt-6 space-y-2">
          {steps.map((step) => (
            <div key={step.number} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {step.number}
              </div>
              <p className="text-sm text-muted-foreground pt-0.5">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

/* === FILTERING EMPTY STATE === */
export function FilteringEmptyState({
  appliedFilters,
  onClear,
}: {
  appliedFilters: string[];
  onClear?: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Search size={24} />
      </div>
      <div className="space-y-2">
        <h3 className="empty-state-title">No results found</h3>
        <p className="empty-state-description">
          We couldn't find any results matching {appliedFilters.length === 1 ? "that filter" : "those filters"}.
        </p>
      </div>
      {onClear && (
        <div className="empty-state-action">
          <button
            onClick={onClear}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

/* === COMING SOON EMPTY STATE === */
export function ComingSoonEmptyState({
  title,
  description,
  releaseDate,
}: {
  title: string;
  description: string;
  releaseDate?: string;
}) {
  return (
    <div className="empty-state bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="empty-state-icon bg-gradient-to-br from-primary/20 to-accent/20">
        <Zap size={24} className="text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
        {releaseDate && (
          <p className="text-xs text-primary/70 font-medium mt-3">
            Coming {releaseDate}
          </p>
        )}
      </div>
    </div>
  );
}

/* === ERROR EMPTY STATE === */
export function ErrorEmptyState({
  title = "Something went wrong",
  description = "We encountered an error. Please try again later.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state bg-gradient-to-br from-danger/5 to-danger/2 border-danger/20">
      <div className="empty-state-icon bg-danger/10 text-danger">
        <HelpCircle size={24} />
      </div>
      <div className="space-y-2">
        <h3 className="empty-state-title text-danger">{title}</h3>
        <p className="empty-state-description">{description}</p>
      </div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

/* === PERMISSION EMPTY STATE === */
export function PermissionEmptyState({
  title = "Access denied",
  description = "You don't have permission to view this content.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Settings size={24} />
      </div>
      <div className="space-y-2">
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
      </div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

/* === SUCCESS EMPTY STATE (for confirmations) === */
export function SuccessEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state bg-gradient-to-br from-success/5 to-success/2 border-success/20">
      <div className="empty-state-icon bg-success/10 text-success">
        <Sparkles size={24} />
      </div>
      <div className="space-y-2">
        <h3 className="empty-state-title text-success">{title}</h3>
        {description && (
          <p className="empty-state-description">{description}</p>
        )}
      </div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

/* === FEATURED CONTENT EMPTY STATE === */
export function FeaturedEmptyState({
  icon: Icon = Lightbulb,
  title,
  description,
  highlights,
  action,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  highlights?: string[];
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
      <div className="empty-state-icon bg-accent/10 text-accent">
        <Icon size={24} />
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="empty-state-title">{title}</h3>
          <p className="empty-state-description">{description}</p>
        </div>

        {highlights && highlights.length > 0 && (
          <div className="space-y-2 border-t border-accent/10 pt-3">
            {highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-accent font-bold">✓</span>
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
