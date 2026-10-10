import React from 'react';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function Alerts({ quotas = [] }) {
  const atRisk = quotas.filter((q) => q.utilization_percentage >= 80);
  const warning = quotas.filter((q) => q.utilization_percentage >= 60 && q.utilization_percentage < 80);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-red-400" />
            Alerts & Active Governance Notifications
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time threshold violation detections, risk alerts, and automated outbound notification dispatches.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {atRisk.map((q) => (
          <div
            key={q.id}
            className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-950/20 flex items-start gap-3"
          >
            <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-400">
                CRITICAL THRESHOLD VIOLATION: {q.metric_name} ({q.region})
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Resource has reached <span className="font-bold text-white">{q.utilization_percentage}%</span> utilization ({q.current_usage} of {q.quota_limit}). Immediate quota increase request required.
              </p>
            </div>
          </div>
        ))}

        {warning.map((q) => (
          <div
            key={q.id}
            className="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-400">
                WARNING THRESHOLD APPROACHING: {q.metric_name} ({q.region})
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Resource is sitting at <span className="font-bold text-white">{q.utilization_percentage}%</span> saturation. Approaching the 80% critical ceiling.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
