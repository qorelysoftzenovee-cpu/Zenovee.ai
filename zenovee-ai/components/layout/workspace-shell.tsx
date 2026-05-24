"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Bolt, CreditCard, FolderHeart, History, Menu, Settings2, TerminalSquare, Wrench, Upload, X } from "lucide-react";
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

export function WorkspaceShell({ children, title, subtitle }: WorkspaceShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeTitle = useMemo(() => {
    const active = primaryNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return title ?? active?.label ?? "Console";
  }, [pathname, title]);

  const breadcrumb = pathname.split("/").filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800/80 bg-slate-950 text-slate-100 transition-all duration-300 lg:block", collapsed ? "w-[92px]" : "w-[284px]")}>
        <aside className="flex h-full flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-3 pb-4">
            <Link href="/dashboard" className="group flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <Bolt size={16} />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-sm font-semibold tracking-tight">Zenovee</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Workspace</p>
                </div>
              ) : null}
            </Link>
            <button onClick={() => setCollapsed((v) => !v)} className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-white/20">
              {collapsed ? "→" : "←"}
            </button>
          </div>

          <div className="mb-4 h-px bg-white/15" />

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
                      ? "bg-white text-slate-900"
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
              <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Credits remaining</p>
                <p className="mt-1 text-sm font-semibold text-white">Live in Console</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Current plan</p>
                <p className="mt-1 text-sm font-semibold text-white">Manage in Billing</p>
              </div>
              <LogoutButton className="w-full justify-start border-white/20 bg-transparent text-slate-100 hover:bg-white/10" />
            </div>
          ) : null}
        </aside>
      </div>

      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[92px]" : "lg:pl-[284px]")}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="rounded-lg border border-slate-300 bg-white p-2 hover:bg-slate-50 lg:hidden">
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">{activeTitle}</p>
                {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
              </div>
            </div>
            <div className="text-xs text-slate-500">Zenovee Workspace</div>
          </div>
          <div className="px-4 pb-3 text-xs text-slate-500 md:px-6 lg:px-8">{breadcrumb.length ? breadcrumb.join(" / ") : "dashboard"}</div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 overflow-x-hidden">{children}</main>
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
