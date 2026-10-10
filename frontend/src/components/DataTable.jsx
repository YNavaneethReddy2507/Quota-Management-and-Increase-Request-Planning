import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';

export default function DataTable({
  quotas = [],
  onRequestIncrease,
  isLoading = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterThreshold, setFilterThreshold] = useState('ALL'); // 'ALL' | 'NORMAL' | 'MODERATE' | 'HIGH'
  const [sortField, setSortField] = useState('utilization_percentage');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter logic
  const filteredQuotas = quotas.filter((item) => {
    const matchesSearch =
      item.metric_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterThreshold === 'HIGH') return item.utilization_percentage >= 80;
    if (filterThreshold === 'MODERATE')
      return item.utilization_percentage >= 60 && item.utilization_percentage < 80;
    if (filterThreshold === 'NORMAL') return item.utilization_percentage < 60;

    return true;
  });

  // Sort logic
  const sortedQuotas = [...filteredQuotas].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  /**
   * Required Conditional Styling for Utilization %:
   * Green (< 60%), Yellow (60-80%), Red (> 80%)
   */
  const getUtilizationStyle = (pct) => {
    if (pct > 80) {
      return {
        text: 'text-red-400 font-bold',
        badge: 'bg-red-500/15 text-red-400 border border-red-500/30',
        label: 'CRITICAL',
      };
    }
    if (pct >= 60) {
      return {
        text: 'text-amber-400 font-semibold',
        badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        label: 'WARNING',
      };
    }
    return {
      text: 'text-emerald-400 font-semibold',
      badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      label: 'OPTIMAL',
    };
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Table Toolbar */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by metric name (e.g. compute/cpus) or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Threshold Quick Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Quotas' },
            { id: 'HIGH', label: 'Critical (>80%)', badge: 'text-red-400' },
            { id: 'MODERATE', label: 'Warning (60-80%)', badge: 'text-amber-400' },
            { id: 'NORMAL', label: 'Optimal (<60%)', badge: 'text-emerald-400' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterThreshold(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterThreshold === btn.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span className={btn.badge}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800/80 font-semibold uppercase tracking-wider">
              <th
                onClick={() => handleSort('metric_name')}
                className="py-3.5 px-5 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Metric Name <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('region')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Region <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('current_usage')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Current Usage <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('quota_limit')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Quota Limit <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('utilization_percentage')}
                className="py-3.5 px-5 cursor-pointer hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Utilization % <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Risk Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="7" className="py-4 px-5">
                    <div className="h-4 bg-slate-800 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : sortedQuotas.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500 text-xs">
                  No quota metrics found matching current filter criteria.
                </td>
              </tr>
            ) : (
              sortedQuotas.map((item) => {
                const util = item.utilization_percentage;
                const utilStyle = getUtilizationStyle(util);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-900/60 transition-colors group"
                  >
                    {/* Metric Name */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors font-mono">
                        {item.metric_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Project: {item.project_id}
                      </div>
                    </td>

                    {/* Region */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[11px]">
                        {item.region}
                      </span>
                    </td>

                    {/* Current Usage */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-200">
                      {item.current_usage.toLocaleString()}
                    </td>

                    {/* Quota Limit */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-400">
                      {item.quota_limit.toLocaleString()}
                    </td>

                    {/* Utilization % with Mandatory Conditional Styling: Green (<60%), Yellow (60-80%), Red (>80%) */}
                    <td className="py-3.5 px-5 text-right font-mono">
                      <span className={`text-sm ${utilStyle.text}`}>
                        {util}%
                      </span>
                    </td>

                    {/* Risk Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${utilStyle.badge}`}
                      >
                        {utilStyle.label}
                      </span>
                    </td>

                    {/* Request Increase Button */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => onRequestIncrease(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Request Increase
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="text-white font-semibold">{sortedQuotas.length}</span> of{' '}
          <span className="text-white font-semibold">{quotas.length}</span> tracked quota limits
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> &lt; 60% Optimal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> 60-80% Approaching
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> &gt; 80% Critical
          </span>
        </div>
      </div>
    </div>
  );
}
