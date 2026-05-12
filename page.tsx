import { getBusinessMetrics, getFinanceMetrics } from "@/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";

export default async function FinancePage() {
  const metrics = await getBusinessMetrics();
  const monthlyData = await getFinanceMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revenue & Operations</h1>
        <p className="text-sm text-slate-500">Real-time financial monitoring and profit margins.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase opacity-50">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <div className="mt-2 flex items-center gap-1 text-emerald-400 text-xs font-bold">
              <ArrowUpRight size={14} /> +14.2% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase text-slate-400">Total API Overhead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">${metrics.totalApiCost.toFixed(2)}</div>
            <div className="mt-2 flex items-center gap-1 text-slate-400 text-xs font-bold">
              Gemini 1.5 Pro/Flash mixed usage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase text-slate-400">Net Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{metrics.profitMargin.toFixed(1)}%</div>
            <p className="text-[10px] text-slate-400 mt-1 italic">Calculated after infrastructure and AI costs</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-64 flex flex-col justify-end gap-2">
        <div className="flex items-end gap-4 h-full">
          {Object.entries(monthlyData).map(([month, val]: any) => (
            <div key={month} className="flex-1 bg-blue-600 rounded-t-lg transition-all hover:bg-blue-700" style={{ height: `${(val / metrics.totalRevenue) * 100}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase border-t pt-4">
          {Object.keys(monthlyData).map(month => <span key={month}>{month}</span>)}
        </div>
      </div>
    </div>
  );
}