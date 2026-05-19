import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/api-cost", label: "API & Cost" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="section-shell py-6">
        <div className="surface-card p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl border border-border/70 bg-muted/40 px-4 py-2 text-sm font-medium hover:bg-muted/70">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
