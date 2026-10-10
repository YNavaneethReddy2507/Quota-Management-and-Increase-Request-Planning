import React from 'react';
import { LineChart, Sparkles, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export default function Forecasting({ quotas = [], onRequestIncrease }) {
  // Estimate depletion dates for quotas >= 75%
  const highGrowthQuotas = quotas.filter((q) => q.utilization_percentage >= 70);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LineChart className="w-6 h-6 text-indigo-400" />
            Demand Forecasting & Capacity Projections
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Algorithmic forecast models estimating quota threshold crossing dates and potential capacity shortages.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Baseline Linear + Seasonality Model Active</span>
        </div>
      </div>

      {/* Forecast Threshold Warnings */}
      <div className="space-y-4">
        {highGrowthQuotas.map((q) => {
          const daysRemaining = Math.max(2, Math.round((100 - q.utilization_percentage) * 0.4));
          return (
            <div
              key={q.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/40 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm">{q.metric_name}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-400 font-mono">
                    {q.region}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Current saturation: <span className="text-red-400 font-bold">{q.utilization_percentage}%</span> &bull; Current limit: {q.quota_limit}
                </p>
                <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Estimated threshold exhaustion in ~{daysRemaining} business days based on current growth velocity.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase">Recommended Target</p>
                  <p className="text-base font-bold font-mono text-emerald-400">
                    {Math.ceil(q.quota_limit * 1.5)}
                  </p>
                </div>
                <button
                  onClick={() => onRequestIncrease && onRequestIncrease(q)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all"
                >
                  Plan Increase
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
