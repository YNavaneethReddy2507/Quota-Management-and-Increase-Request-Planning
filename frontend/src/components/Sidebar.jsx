import React from 'react';
import {
  LayoutDashboard,
  Gauge,
  CheckCircle2,
  Settings,
  Cloud,
  ChevronRight,
  Shield,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingCount = 0,
  atRiskCount = 0,
  selectedProject,
  setSelectedProject,
  projects = [],
  userRole = 'Admin',
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: atRiskCount > 0 ? `${atRiskCount} Risk` : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'quotas',
      label: 'Quota Inventory',
      icon: Gauge,
    },
    {
      id: 'analytics',
      label: 'Historical Analytics',
      icon: Layers,
    },
    {
      id: 'forecasting',
      label: 'Demand Forecasting',
      icon: Shield,
    },
    {
      id: 'approvals',
      label: 'Approval Center',
      icon: CheckCircle2,
      badge: pendingCount > 0 ? `${pendingCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      adminOnly: true,
    },
    {
      id: 'alerts',
      label: 'Alerts & Governance',
      icon: AlertTriangle,
      badge: atRiskCount > 0 ? `${atRiskCount}` : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'reports',
      label: 'Reports & Exports',
      icon: Layers,
    },
    {
      id: 'settings',
      label: 'Settings & IAM',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
            Cloud Quota Plane
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">v1.0</span>
          </div>
          <p className="text-[11px] text-slate-400">Google Cloud Governance</p>
        </div>
      </div>

      {/* Target GCP Project Switcher */}
      <div className="p-4 border-b border-slate-800/60">
        <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-400" /> Tracked GCP Project
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          {projects.length > 0 ? (
            projects.map((p) => (
              <option key={p.id} value={p.gcp_project_id}>
                {p.gcp_project_id} ({p.environment})
              </option>
            ))
          ) : (
            <option value="enterprise-prod-finance-42">enterprise-prod-finance-42 (PROD)</option>
          )}
        </select>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main Application Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          // Hide admin only items if Developer role is selected
          if (item.adminOnly && userRole === 'Developer') {
            return null;
          }
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} aria-hidden="true" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Indicator Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${userRole === 'Admin' ? 'text-amber-400' : 'text-emerald-400'}`} />
            <div>
              <p className="text-xs font-medium text-slate-200">Role: {userRole}</p>
              <p className="text-[10px] text-slate-500">{userRole === 'Admin' ? 'Full Approval Rights' : 'Request & View Only'}</p>
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full ${userRole === 'Admin' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
        </div>
      </div>
    </aside>
  );
}
