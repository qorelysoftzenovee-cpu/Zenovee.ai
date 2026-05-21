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
      <header className={cn(
        "border-b border-border/70 backdrop-blur-xl transition-all duration-200",
        isAdmin ? "bg-gradient-to-b from-slate-950/95 to-slate-950/90" : "bg-gradient-to-b from-background/95 to-background/85"
      )}>
        <div className="section-shell flex min-h-24 flex-col justify-between gap-4 py-6 md:flex-row md:items-center md:py-8">
          <div className="max-w-3xl space-y-2 animate-enter">
            <div className={cn("premium-label", isAdmin && "border-white/15 bg-white/5 text-slate-300")}>
              {isAdmin ? "Admin console" : "Account overview"}
            </div>
            <h1 className={cn(
              "text-3xl font-semibold tracking-tight leading-tight md:text-4xl",
              isAdmin ? "text-slate-100" : "text-foreground"
            )}>
              {title}
            </h1>
            {description ? (
              <p className={cn(
                "max-w-2xl text-sm md:text-base leading-relaxed",
                isAdmin ? "text-slate-300/80" : "text-muted-foreground"
              )}>
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 md:justify-end animate-enter" style={{ animationDelay: "100ms" }}>
              {actions}
            </div>
          ) : null}
        </div>
      </header>
      <main className="section-shell py-8 md:py-10 lg:py-12 animate-enter" style={{ animationDelay: "150ms" }}>
        {children}
      </main>
    </div>
  );
}
