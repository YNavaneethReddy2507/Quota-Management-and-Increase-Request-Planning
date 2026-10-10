import React from 'react';
import MetricCard from '../components/MetricCard';
import {
  Layers,
  AlertTriangle,
  Clock,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Server,
  Cpu,
  ArrowRight,
} from 'lucide-react';

export default function Dashboard({
  quotas = [],
  requests = [],
  selectedProject,
  onNavigateToQuotas,
  onNavigateToApprovals,
  onRequestIncrease,
}) {
  // Filter quotas for selected project
  const projectQuotas = quotas.filter(
    (q) => !selectedProject || q.project_id === selectedProject || selectedProject === 'all'
  );

  const totalQuotasCount = quotas.length;
  const atRiskQuotas = quotas.filter((q) => q.utilization_percentage >= 80);
  const atRiskCount = atRiskQuotas.length;
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const pendingCount = pendingRequests.length;

  // Top 5 most utilized resources sorted descending by utilization_percentage
  const topUtilized = [...quotas]
    .sort((a, b) => b.utilization_percentage - a.utilization_percentage)
    .slice(0, 5);

  const getBarColor = (pct) => {
    if (pct >= 80) return 'bg-red-500';
    if (pct >= 60) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const getTextColor = (pct) => {
    if (pct >= 80) return 'text-red-400 font-bold';
    if (pct >= 60) return 'text-amber-400 font-semibold';
    return 'text-emerald-400 font-semibold';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Governance Control Plane Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time Google Cloud Quota saturation telemetry, automated capacity planning, and risk thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Cloud Telemetry Active
          </span>
        </div>
      </div>

      {/* Top 3 Core Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Total Quotas Monitored */}
        <MetricCard
          title="Total Quotas Monitored"
          value={totalQuotasCount}
          subtitle="Across active GCP services & regions"
          icon={Layers}
          variant="default"
          onClick={onNavigateToQuotas}
        />

        {/* Metric 2: At-Risk Quotas (Styled in RED if > 0) */}
        <MetricCard
          title="At-Risk Quotas"
          value={atRiskCount}
          subtitle={atRiskCount > 0 ? "Exceeding 80% saturation threshold" : "All resource quotas within safe limits"}
          icon={AlertTriangle}
          variant={atRiskCount > 0 ? "danger" : "success"}
          onClick={onNavigateToQuotas}
        />

        {/* Metric 3: Pending Approvals (Styled in YELLOW) */}
        <MetricCard
          title="Pending Approvals"
          value={pendingCount}
          subtitle={pendingCount > 0 ? "Awaiting internal architecture review" : "No open increase requests pending"}
          icon={Clock}
          variant={pendingCount > 0 ? "warning" : "default"}
          onClick={onNavigateToApprovals}
        />
      </div>

      {/* Top 5 Most Utilized Resources Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Top 5 Resource Quota Burn Rates
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identified critical infrastructure bottlenecks requiring proactive limit expansions
            </p>
          </div>
          <button
            onClick={onNavigateToQuotas}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            Explore all {totalQuotasCount} quotas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bar Chart / Utilization Progress List */}
        <div className="space-y-4">
          {topUtilized.map((item, index) => {
            const pct = item.utilization_percentage;
            return (
              <div
                key={item.id || index}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/80 transition-all group"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-slate-300 text-[11px]">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {item.metric_name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Region: <span className="text-slate-400">{item.region}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-sm ${getTextColor(pct)}`}>
                        {pct}%
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.current_usage} / {item.quota_limit}
                      </p>
                    </div>

                    <button
                      onClick={() => onRequestIncrease(item)}
                      className="px-2.5 py-1 rounded text-[11px] font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                    >
                      Request Increase
                    </button>
                  </div>
                </div>

                {/* Visual Bar Chart Progress Track */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getBarColor(pct)}`}
                    style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
