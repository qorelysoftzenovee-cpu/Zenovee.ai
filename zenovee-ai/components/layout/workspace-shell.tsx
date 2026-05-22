"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Bolt, ChevronDown, CreditCard, Grid3X3, History, Menu, Settings2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";

type WorkspaceShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

const primaryNav = [
  { label: "Dashboard", href: "/dashboard", icon: Grid3X3 },
  { label: "Workspaces", href: "/dashboard/tools", icon: Sparkles },
  { label: "History", href: "/history", icon: History },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

const workspaceNav = [
  "LinkedIn Authority OS",
  "Sales Outreach OS",
  "Conversion Copy OS",
  "SEO Growth OS",
  "AI Brand Studio",
];

const workspaceLabelById: Record<string, string> = {
  "linkedin-authority-os": "LinkedIn Authority OS",
  "sales-outreach-os": "Sales Outreach OS",
  "conversion-copy-os": "Conversion Copy OS",
  "seo-growth-os": "SEO Growth OS",
  "ai-brand-studio": "AI Brand Studio",
};

export function WorkspaceShell({ children, title, subtitle }: WorkspaceShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeWorkspaceLabel, setActiveWorkspaceLabel] = useState(workspaceNav[0]);

  const workspaceFromRoute = searchParams.get("workspace") ?? "";
  const resolvedWorkspaceLabel = workspaceLabelById[workspaceFromRoute] ?? activeWorkspaceLabel;

  const activeTitle = useMemo(() => {
    const active = primaryNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return title ?? active?.label ?? "Workspace";
  }, [pathname, title]);

  const breadcrumb = pathname.split("/").filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-100 text-foreground">
      <div className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800/80 bg-slate-950 text-slate-100 transition-all duration-300 lg:block", collapsed ? "w-[92px]" : "w-[284px]")}>
        <aside className="flex h-full flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-3 pb-4">
            <Link href="/dashboard" className="group flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-background">
                <Bolt size={16} />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-sm font-semibold tracking-tight">Zenovee</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Workspace OS</p>
                </div>
              ) : null}
            </Link>
            <button onClick={() => setCollapsed((v) => !v)} className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-white/20">
              {collapsed ? "→" : "←"}
            </button>
          </div>

          <div className="mb-4 h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

          <nav className="flex-1 space-y-1.5">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          {!collapsed ? (
            <div className="mt-auto space-y-3 border-t border-white/15 pt-4">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspaces</p>
              <div className="space-y-1">
                {workspaceNav.map((item) => (
                  <button
                    key={item}
                    onClick={() => setActiveWorkspaceLabel(item)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition",
                      activeWorkspaceLabel === item ? "bg-white/15 text-white" : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!collapsed ? <LogoutButton className="mt-3 w-full border-white/20 bg-transparent text-slate-100 hover:bg-white/10" /> : null}
        </aside>
      </div>

      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[92px]" : "lg:pl-[284px]")}>
        <header className="sticky top-0 z-30 border-b border-border/70 bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="rounded-lg border border-border/60 bg-card p-2 hover:bg-muted/60 lg:hidden">
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">{activeTitle}</p>
                <p className="truncate text-xs text-muted-foreground">{subtitle ?? "Focused AI workspace"}</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-1.5 md:flex">
              <span className="text-xs text-muted-foreground">Workspace</span>
              <span className="text-xs font-medium">{resolvedWorkspaceLabel}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
          </div>
          <div className="px-4 pb-3 text-xs text-muted-foreground md:px-6 lg:px-8">{breadcrumb.length ? breadcrumb.join(" / ") : "dashboard"}</div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-[84%] max-w-xs border-r border-slate-800 bg-slate-950 p-4 text-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <p className="font-semibold tracking-tight">Zenovee</p>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg border border-white/20 bg-white/10 p-2">
                <X size={16} />
              </button>
            </div>
            <nav className="space-y-1.5">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" : "text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
