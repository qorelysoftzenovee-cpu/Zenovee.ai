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
      <header className="border-b border-border/70 bg-card/55 backdrop-blur-xl">
        <div className="section-shell flex min-h-24 flex-col justify-between gap-4 py-6 md:flex-row md:items-center">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex w-fit items-center rounded-full border border-accent/15 bg-accent/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Zenovee Workspace
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
            {description ? <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div> : null}
        </div>
      </header>
      <main className="section-shell py-8 md:py-10">{children}</main>
    </div>
  );
}
