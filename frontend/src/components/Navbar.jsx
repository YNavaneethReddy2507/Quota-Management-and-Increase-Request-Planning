import React from 'react';
import {
  ChevronRight,
  RefreshCw,
  User,
  Shield,
  Bell,
  Sparkles,
} from 'lucide-react';

export default function Navbar({
  activeTab,
  userRole,
  setUserRole,
  environment = 'PRODUCTION',
  setEnvironment,
  onRefreshTelemetry,
  isRefreshing = false,
}) {
  const breadcrumbLabels = {
    dashboard: 'Dashboard Overview',
    quotas: 'Quota Explorer & Live Telemetry',
    approvals: 'Internal Approval Center',
    settings: 'Settings & GCP IAM Configuration',
  };

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 sticky top-0 z-20 backdrop-blur-md px-6 flex items-center justify-between ml-64">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <span className="hover:text-slate-200 cursor-pointer">Google Cloud</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="hover:text-slate-200 cursor-pointer">Quota Control Plane</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-blue-400 font-medium">{breadcrumbLabels[activeTab] || 'Dashboard'}</span>
      </nav>

      {/* Controls & User Profile */}
      <div className="flex items-center gap-3">
        {/* Telemetry Sync Trigger */}
        <button
          onClick={onRefreshTelemetry}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all hover:border-slate-600 disabled:opacity-50"
          title="Trigger instantaneous GCP telemetry ingestion"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
        </button>

        {/* Environment Pill */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-[11px]">
          <button
            onClick={() => setEnvironment && setEnvironment('PRODUCTION')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              environment === 'PRODUCTION'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PROD
          </button>
          <button
            onClick={() => setEnvironment && setEnvironment('DEVELOPMENT')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              environment === 'DEVELOPMENT'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DEV
          </button>
        </div>

        {/* Role Switcher (RBAC mock) */}
        <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">Role:</span>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="Admin" className="bg-slate-900 text-white">Admin</option>
            <option value="Developer" className="bg-slate-900 text-white">Developer</option>
          </select>
        </div>

        {/* Mock User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white shadow-md">
            YA
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-slate-200 leading-tight">Navaneeth Reddy</p>
            <p className="text-[10px] text-slate-400 leading-tight">Lead Cloud Architect</p>
          </div>
        </div>
      </div>
    </header>
  );
}
