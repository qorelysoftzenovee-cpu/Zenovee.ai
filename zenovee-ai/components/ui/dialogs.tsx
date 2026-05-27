"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./button";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "destructive" | "success";
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  variant = "default",
}: DialogProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  const variantClasses = {
    default: "border-border/60",
    destructive: "border-danger/20",
    success: "border-success/20",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm animate-fade"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className={cn(
        "relative mx-4 w-full rounded-[28px] border bg-white/96 shadow-[0_30px_80px_-38px_rgba(15,23,42,0.4)] backdrop-blur-xl animate-scale",
        sizeClasses[size],
        variantClasses[variant]
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/60 p-6 md:p-7">
          <div className="flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
            {description && (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-transparent p-1.5 transition-colors duration-200 hover:border-border hover:bg-muted/70"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        {children && (
          <div className="p-6 md:p-7">
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-border/60 p-4 md:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* === CONFIRMATION DIALOG === */
export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive" | "success";
  isLoading?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const confirmButtonVariant = 
    variant === "destructive" ? "destructive" :
    variant === "success" ? "default" :
    "default";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading || isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={loading || isLoading}
          >
            {loading || isLoading ? "Working..." : confirmLabel}
          </Button>
        </>
      }
    />
  );
}

/* === ALERT DIALOG === */
export function AlertDialog({
  isOpen,
  onClose,
  icon: Icon,
  title,
  description,
  action,
  actionLabel = "Got it",
  variant = "default",
}: {
  isOpen: boolean;
  onClose: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  variant?: "default" | "warning" | "danger" | "success";
}) {
  const variantColors = {
    default: "text-primary",
    warning: "text-warning",
    danger: "text-danger",
    success: "text-success",
  };

  const variantBgColors = {
    default: "bg-primary/10",
    warning: "bg-warning/10",
    danger: "bg-danger/10",
    success: "bg-success/10",
  };

  const dialogVariant: DialogProps["variant"] =
    variant === "danger" ? "destructive" :
    variant === "success" ? "success" :
    "default";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={dialogVariant}
      size="sm"
      footer={
        <Button
          variant={variant === "danger" ? "destructive" : "default"}
          onClick={() => {
            action?.();
            onClose();
          }}
        >
          {actionLabel}
        </Button>
      }
    >
      {Icon && (
        <div className={cn("flex justify-center mb-4")}>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", variantBgColors[variant])}>
            <Icon size={24} className={variantColors[variant]} />
          </div>
        </div>
      )}
    </Dialog>
  );
}

/* === FORM DIALOG === */
export function FormDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  submitLabel = "Submit",
  onSubmit,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitLabel?: string;
  onSubmit: () => void | Promise<void>;
  isLoading?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || isLoading}
          >
            {loading || isLoading ? "Working..." : submitLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
