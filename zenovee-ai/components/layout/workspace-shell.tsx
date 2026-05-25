"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bolt,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FolderHeart,
  History,
  Menu,
  Search,
  Settings2,
  Sparkles,
  Star,
  TerminalSquare,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";

type WorkspaceShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

const primaryNav = [
  { label: "Console", href: "/dashboard", icon: TerminalSquare },
  { label: "Tools", href: "/dashboard/tools", icon: Wrench },
  { label: "History", href: "/history", icon: History },
  { label: "Saved Outputs", href: "/outputs", icon: FolderHeart },
  { label: "Exports", href: "/exports", icon: Upload },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

const workspaceTabs = [
  { label: "Tools", href: "/dashboard/tools", icon: Wrench },
  { label: "History", href: "/history", icon: History },
  { label: "Favorites", href: "/history?view=favorites", icon: Star },
  { label: "Exports", href: "/exports", icon: Upload },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

export function WorkspaceShell({ children, title, subtitle }: WorkspaceShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeTitle = useMemo(() => {
    const active = primaryNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return title ?? active?.label ?? "Console";
  }, [pathname, title]);

  const breadcrumb = pathname.split("/").filter(Boolean);

  const isFavoritesActive = pathname === "/history";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_35%),hsl(var(--background))] text-foreground">
      <div className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-border/70 bg-slate-950/95 text-slate-100 backdrop-blur-xl transition-all duration-300 lg:block", collapsed ? "w-[94px]" : "w-[288px]")}>
        <aside className="flex h-full flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-3 pb-3">
            <Link href="/dashboard" className="group flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-[0_10px_20px_-14px_rgba(255,255,255,0.6)]">
                <Bolt size={16} />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-sm font-semibold tracking-tight">Zenovee</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">AI Workspace</p>
                </div>
              ) : null}
            </Link>
            <button onClick={() => setCollapsed((v) => !v)} className="rounded-lg border border-white/15 bg-white/10 p-1.5 text-slate-200 transition hover:bg-white/20">
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {!collapsed ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-2">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-slate-300">
                <Search size={13} />
                Quick search
              </div>
            </div>
          ) : null}

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
                      ? "bg-white text-slate-900 shadow-[0_10px_20px_-16px_rgba(255,255,255,0.95)]"
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
            <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
              <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Usage & Credits</p>
                <Link href="/dashboard" className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white">
                  View usage dashboard <Sparkles size={13} />
                </Link>
              </div>
              <LogoutButton className="w-full justify-start border-white/20 bg-transparent text-slate-100 hover:bg-white/10" />
            </div>
          ) : null}
        </aside>
      </div>

      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[92px]" : "lg:pl-[284px]")}>
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/92 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="rounded-lg border border-border bg-card p-2 hover:bg-muted lg:hidden">
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">{activeTitle}</p>
                {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
              </div>
            </div>
            <div className="hidden text-xs text-muted-foreground md:block">Zenovee Workspace</div>
          </div>
          <div className="border-t border-border/60 px-4 py-2.5 md:px-6 lg:px-8">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {workspaceTabs.map((tab) => {
                const Icon = tab.icon;
                const active =
                  tab.label === "Favorites"
                    ? isFavoritesActive
                    : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                return (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                      active ? "border-primary/20 bg-primary/10 text-primary" : "border-border/70 bg-card/80 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-2 text-xs text-muted-foreground">{breadcrumb.length ? breadcrumb.join(" / ") : "dashboard"}</div>
          </div>
        </header>

        <main className="overflow-x-hidden p-4 md:p-6 lg:p-8">{children}</main>
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
                      active ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <LogoutButton className="mt-4 w-full justify-start border-white/20 bg-transparent text-slate-100 hover:bg-white/10" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
