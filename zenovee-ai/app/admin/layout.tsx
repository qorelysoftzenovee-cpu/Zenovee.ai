import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireAdmin } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-slate-950/90 px-5 py-6">
          <div className="sticky top-0 space-y-6">
            <div className="space-y-3">
              <Link href="/admin" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#0ea5e9_100%)] text-lg font-semibold text-white">
                  Z
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Admin</p>
                  <p className="text-lg font-semibold text-white">Zenovee Control</p>
                </div>
              </Link>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Signed in as</p>
                <p className="mt-2 break-all text-sm font-medium text-white">{admin.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Production security</p>
              <ul className="space-y-2">
                <li>• Middleware-protected admin routes</li>
                <li>• Server-side role verification</li>
                <li>• API checks on /api/admin/*</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/dashboard" className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
                Open user dashboard
              </Link>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_22%),radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_20%),#020617]">
          {children}
        </div>
      </div>
    </div>
  );
}
