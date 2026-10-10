import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, ArrowUpRight, Clock } from 'lucide-react';

export default function Analytics({ quotas = [] }) {
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Historical Utilization Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical consumption time-series, burn rate analysis, and multi-regional utilization velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          {['7d', '30d', '60d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                timeRange === range
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Historical Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase">Average Daily Burn Rate</p>
          <h3 className="text-2xl font-bold text-white mt-1">+2.4% / day</h3>
          <p className="text-xs text-slate-500 mt-2">Highest acceleration in Compute Engine CPUs</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase">Peak Recorded Saturation</p>
          <h3 className="text-2xl font-bold text-amber-400 mt-1">94.5%</h3>
          <p className="text-xs text-slate-500 mt-2">Observed during batch processing window</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase">Telemetry Observation Points</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">4,320 points</h3>
          <p className="text-xs text-slate-500 mt-2">Sampled continuously every 5 minutes</p>
        </div>
      </div>

      {/* Trend Overview List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Resource Velocity Breakdown
        </h3>
        <div className="divide-y divide-slate-800/80">
          {quotas.map((q) => (
            <div key={q.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-200 font-mono">{q.metric_name}</p>
                <p className="text-[11px] text-slate-500">{q.region} &bull; Limit: {q.quota_limit}</p>
              </div>
              <div className="text-right">
                <span className={`font-mono font-bold ${q.utilization_percentage >= 80 ? 'text-red-400' : 'text-slate-300'}`}>
                  {q.utilization_percentage}% utilized
                </span>
                <p className="text-[10px] text-slate-500">Usage: {q.current_usage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
