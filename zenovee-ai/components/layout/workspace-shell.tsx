"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Bolt, CreditCard, Grid3X3, History, Menu, Settings2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function WorkspaceShell({ children, title, subtitle }: WorkspaceShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeTitle = useMemo(() => {
    const active = primaryNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return title ?? active?.label ?? "Workspace";
  }, [pathname, title]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border/70 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-xl transition-all duration-300 ease-out lg:block",
          collapsed ? "w-[92px]" : "w-[284px]"
        )}
      >
        <aside className="flex h-full flex-col p-4">
          {/* Logo */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-2">
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-background transition-all duration-200 group-hover:shadow-[0_8px_16px_-6px_rgba(79,70,229,0.4)]">
                <Bolt size={16} />
              </div>
              {!collapsed ? (
                <div className="transition-all duration-200">
                  <p className="text-sm font-semibold tracking-tight">Zenovee</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Workspace OS</p>
                </div>
              ) : null}
            </Link>
            <button 
              onClick={() => setCollapsed((v) => !v)} 
              className="rounded-lg border border-border/60 bg-background hover:bg-muted transition-all duration-200 px-2 py-1 text-xs font-medium hover:border-border/80"
            >
              {collapsed ? "→" : "←"}
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-border/0 via-border/50 to-border/0 mb-4" />

          {/* Primary Navigation */}
          <nav className="space-y-1.5 flex-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                    active 
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_8px_16px_-8px_rgba(79,70,229,0.4)]" 
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:translate-x-0.5"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          {/* Workspaces Section */}
          {!collapsed ? (
            <div className="mt-auto space-y-3 border-t border-border/50 pt-4">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Workspaces</p>
              <div className="space-y-1">
                {workspaceNav.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground/80"
                    aria-hidden="true"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {/* Main Content Area */}
      <div className={cn("transition-all duration-300 ease-out", collapsed ? "lg:pl-[92px]" : "lg:pl-[284px]")}>
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-gradient-to-b from-background/95 via-background/90 to-background/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8 transition-all duration-200">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMobileOpen(true)} 
                className="rounded-lg border border-border/60 bg-card hover:bg-muted/60 p-2 transition-all duration-200 lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight truncate">{activeTitle}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle ?? "Focused AI workspace"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8 animate-enter">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen ? (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="animate-slide-in h-full w-[84%] max-w-xs border-r border-border bg-gradient-to-br from-card via-card to-card/95 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="font-semibold tracking-tight">Zenovee</p>
              <button 
                onClick={() => setMobileOpen(false)} 
                className="rounded-lg border border-border/60 bg-background hover:bg-muted p-2 transition-all duration-200"
              >
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
                      active 
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" 
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
