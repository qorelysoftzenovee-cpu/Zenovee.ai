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
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      <header className={cn("border-b border-white/10 backdrop-blur-xl", isAdmin ? "bg-card/90" : "bg-background/70")}>
        <div className="section-shell flex min-h-24 flex-col justify-between gap-4 py-7 md:flex-row md:items-center">
          <div className="max-w-3xl space-y-2">
            <div className="premium-label">
              {isAdmin ? "Admin console" : "Account overview"}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
            {description ? <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div> : null}
        </div>
      </header>
      <main className="section-shell py-8 md:py-10">{children}</main>
    </div>
  );
}
