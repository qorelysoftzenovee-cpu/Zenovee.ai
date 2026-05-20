import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireAdmin } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-white/10 bg-slate-950 px-5 py-6 text-slate-100">
          <div className="sticky top-0 space-y-6">
            <div className="space-y-3">
              <Link href="/admin" className="inline-flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-base font-semibold text-white">
                  Z
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin</p>
                  <p className="text-base font-semibold text-white">Zenovee Console</p>
                </div>
              </Link>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="mt-1 break-all text-sm text-white">{admin.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/8 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3">
              <Link href="/dashboard" className="rounded-xl border border-white/15 px-3 py-2.5 text-center text-sm text-slate-200 transition hover:bg-white/8">
                User dashboard
              </Link>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-slate-950">{children}</div>
      </div>
    </div>
  );
}
