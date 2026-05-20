import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "dashboard" | "admin";
};

export function PageShell({ title, description, actions, children, className, variant = "dashboard" }: PageShellProps) {
  const isAdmin = variant === "admin";
  return (
    <div className={cn("min-h-screen bg-background text-foreground", isAdmin && "text-slate-100", className)}>
      <header className={cn("border-b border-white/10 backdrop-blur-xl", isAdmin ? "bg-slate-950/80" : "bg-background/70")}>
        <div className="section-shell flex min-h-24 flex-col justify-between gap-4 py-6 md:flex-row md:items-center">
          <div className="max-w-3xl space-y-2">
            <div className={cn("premium-label", isAdmin && "border-white/15 bg-white/5 text-slate-300")}>
              {isAdmin ? "Admin console" : "Account overview"}
            </div>
            <h1 className={cn("text-3xl font-semibold tracking-tight md:text-4xl", isAdmin ? "text-slate-100" : "text-foreground")}>{title}</h1>
            {description ? <p className={cn("max-w-2xl text-sm md:text-base", isAdmin ? "text-slate-300" : "text-muted-foreground")}>{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div> : null}
        </div>
      </header>
      <main className="section-shell py-8 md:py-10 lg:py-12">{children}</main>
    </div>
  );
}
