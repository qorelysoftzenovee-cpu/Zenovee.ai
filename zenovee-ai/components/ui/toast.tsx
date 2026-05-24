"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({
  id,
  title,
  description,
  variant = "default",
  duration = 5000,
  onClose,
  action,
}: ToastProps) {
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const variantClasses = {
    default: "border-border/60 bg-card text-foreground",
    success: "border-success/20 bg-success/10 text-success",
    error: "border-danger/20 bg-danger/10 text-danger",
    warning: "border-warning/20 bg-warning/10 text-warning",
    info: "border-primary/20 bg-primary/10 text-primary",
  };

  const iconClasses = {
    default: null,
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = iconClasses[variant];

  return (
    <div className={cn(
      "pointer-events-auto animate-slide-in rounded-xl border p-4 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] backdrop-blur-sm",
      variantClasses[variant]
    )}>
      <div className="flex items-start gap-3">
        {Icon && <Icon size={20} className="shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          {description && (
            <p className="text-xs mt-1 opacity-90">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {action && (
            <button
              onClick={action.onClick}
              className="px-2 py-1 text-xs font-medium hover:opacity-80 transition-opacity duration-200"
            >
              {action.label}
            </button>
          )}
          <button
            onClick={() => onClose(id)}
            className="hover:opacity-50 transition-opacity duration-200"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* === TOAST CONTAINER === */
export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

/* === TOAST HOOK === */
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback((
    {
      title,
      description,
      variant = "default",
      duration = 5000,
      action,
    }: Omit<ToastProps, "id" | "onClose">
  ) => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { id, title, description, variant, duration, onClose: removeToast, action }]);
  }, [removeToast]);

  return { toasts, addToast, removeToast };
}

/* === TOAST CONTEXT === */
const ToastContext = React.createContext<ReturnType<typeof useToast> | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return context;
}
