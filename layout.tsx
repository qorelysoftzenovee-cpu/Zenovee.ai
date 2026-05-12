import { ReactNode } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Users, CreditCard, Tool, 
  ShieldAlert, Settings, TrendingUp, 
  BarChart3, LifeBuoy, Zap, DollarSign, History
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Tool Performance', href: '/admin/tools', icon: Tool },
  { name: 'AI Usage', href: '/admin/ai', icon: Zap },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { name: 'History', href: '/admin/history', icon: History },
  { name: 'Revenue & Costs', href: '/admin/finance', icon: BarChart3 },
  { name: 'Security & Abuse', href: '/admin/security', icon: ShieldAlert },
  { name: 'Support Tickets', href: '/admin/support', icon: LifeBuoy },
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F8F9FB] text-[#1A1C21]">
      {/* Professional Business Sidebar */}
      <aside className="w-64 bg-[#0F1115] text-white flex flex-col border-r border-white/10">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">Z</div>
          <span className="font-semibold tracking-tight uppercase text-xs opacity-70">SaaS Command Center</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/5 transition-colors"
            >
              <item.icon className="mr-3 h-4 w-4 text-white/50 group-hover:text-white" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/5">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="opacity-80">Systems Operational</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold">Operations Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-gray-400">SERVER TIME</span>
              <span className="text-sm font-mono">{new Date().toLocaleTimeString()} UTC</span>
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}