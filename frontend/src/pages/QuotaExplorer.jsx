import React from 'react';
import DataTable from '../components/DataTable';
import { Gauge, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export default function QuotaExplorer({
  quotas = [],
  onRequestIncrease,
  isLoading = false,
}) {
  const atRiskCount = quotas.filter((q) => q.utilization_percentage >= 80).length;
  const warningCount = quotas.filter((q) => q.utilization_percentage >= 60 && q.utilization_percentage < 80).length;
  const optimalCount = quotas.filter((q) => q.utilization_percentage < 60).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Gauge className="w-6 h-6 text-blue-400" />
            Quota Explorer & Telemetry Heatmap
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-regional Google Cloud consumption telemetry and automated quota headroom analysis.
          </p>
        </div>

        {/* Quick telemetry badges */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs">
            <span className="text-red-400 font-bold">{atRiskCount}</span>{' '}
            <span className="text-slate-400">Critical</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs">
            <span className="text-amber-400 font-bold">{warningCount}</span>{' '}
            <span className="text-slate-400">Warning</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
            <span className="text-emerald-400 font-bold">{optimalCount}</span>{' '}
            <span className="text-slate-400">Optimal</span>
          </div>
        </div>
      </div>

      {/* Main Complex Data Table */}
      <DataTable
        quotas={quotas}
        onRequestIncrease={onRequestIncrease}
        isLoading={isLoading}
      />
    </div>
  );
}
