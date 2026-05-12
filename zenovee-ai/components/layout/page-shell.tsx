import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({ title, description, actions, children, className }: PageShellProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <header className="border-b border-border/70 bg-card/60 backdrop-blur">
        <div className="section-shell flex min-h-20 items-center justify-between gap-4 py-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      </header>
      <main className="section-shell py-10">{children}</main>
    </div>
  );
}
