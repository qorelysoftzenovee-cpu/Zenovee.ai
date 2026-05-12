// full/path/to/app/dashboard/billing/components/UsageHistory.tsx
import React from 'react';
import { ToolUsage, CreditLog } from '@prisma/client';
import { Zap, Clock, DollarSign } from 'lucide-react';

interface UsageHistoryProps {
  toolUsageHistory: ToolUsage[];
  creditLogs: CreditLog[];
}

export default function UsageHistory({ toolUsageHistory, creditLogs }: UsageHistoryProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Tool Usage & Credit Activity</h3>
      <div className="space-y-4">
        {toolUsageHistory.length === 0 && creditLogs.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No recent activity.</p>
        ) : (
          [...toolUsageHistory, ...creditLogs]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10) // Show last 10 activities
            .map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  {item.hasOwnProperty('toolName') ? (
                    <Zap size={20} className="text-blue-500" />
                  ) : (
                    <DollarSign size={20} className="text-green-500" />
                  )}
                  <div>
                    <p className="font-medium text-slate-800">
                      {item.hasOwnProperty('toolName') ? (item as ToolUsage).toolName : (item as CreditLog).description || (item as CreditLog).type}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className={`font-bold ${item.hasOwnProperty('creditsUsed') ? 'text-red-600' : 'text-green-600'}`}>
                  {item.hasOwnProperty('creditsUsed') ? `-${(item as ToolUsage).creditsUsed} Credits` : `+${(item as CreditLog).amount} Credits`}
                </p>
              </div>
            ))
        )}
      </div>
    </div>
  );
}