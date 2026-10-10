import React from 'react';
import { FileText, Download, Printer, Table } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Reports({ quotas = [] }) {
  const handleExportCsv = () => {
    const headers = ['Metric Name', 'Region', 'Current Usage', 'Quota Limit', 'Utilization %'];
    const rows = quotas.map((q) => [
      q.metric_name,
      q.region,
      q.current_usage,
      q.quota_limit,
      `${q.utilization_percentage}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gcp_quota_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Quota telemetry CSV report downloaded successfully');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Governance Reports & Export Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Export comprehensive quota compliance data, audit logs, and risk summaries for FinOps and architecture audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            Print Report
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Compliance Summary Report Preview
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Metric Name</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3 text-right">Usage</th>
                <th className="py-2.5 px-3 text-right">Limit</th>
                <th className="py-2.5 px-3 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {quotas.map((q) => (
                <tr key={q.id}>
                  <td className="py-2 px-3 text-slate-200">{q.metric_name}</td>
                  <td className="py-2 px-3 text-slate-400">{q.region}</td>
                  <td className="py-2 px-3 text-right text-slate-300">{q.current_usage}</td>
                  <td className="py-2 px-3 text-right text-slate-400">{q.quota_limit}</td>
                  <td className={`py-2 px-3 text-right font-bold ${q.utilization_percentage >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {q.utilization_percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
