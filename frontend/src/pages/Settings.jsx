import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Bell,
  Clock,
  Shield,
  Users,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCw,
  Info,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../api/client';

export default function Settings({ userRole = 'Admin' }) {
  const [activeTab, setActiveTab] = useState('thresholds');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [warningPct, setWarningPct] = useState(75);
  const [criticalPct, setCriticalPct] = useState(90);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [alertEmail, setAlertEmail] = useState('cloud-sre-team@enterprise.org');
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [slackChannel, setSlackChannel] = useState('#gcp-quota-alerts');
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://example.com/api/webhook-placeholder');
  const [syncFrequency, setSyncFrequency] = useState('HOURLY');
  const [auditLogs, setAuditLogs] = useState([]);

  const isAdmin = userRole === 'Admin';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.settings.get();
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.thresholds) {
          setWarningPct(d.thresholds.global_warning_pct || 75);
          setCriticalPct(d.thresholds.global_critical_pct || 90);
        }
        if (d.notifications) {
          setEmailEnabled(!!d.notifications.email_enabled);
          setAlertEmail(d.notifications.alert_email || '');
          setSlackEnabled(!!d.notifications.slack_enabled);
          setSlackChannel(d.notifications.slack_channel || '');
          setWebhookEnabled(!!d.notifications.webhook_enabled);
          setWebhookUrl(d.notifications.webhook_url || '');
        }
        if (d.telemetry_sync) {
          setSyncFrequency(d.telemetry_sync.frequency || 'HOURLY');
        }
      }

      const auditRes = await api.settings.getAudit();
      if (auditRes.data?.data) {
        setAuditLogs(auditRes.data.data);
      }
    } catch (err) {
      console.warn('Could not load remote settings, using local defaults', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Admin role required to modify configuration');
      return;
    }

    if (Number(warningPct) >= Number(criticalPct)) {
      toast.error('Warning threshold must be strictly lower than critical threshold');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        thresholds: {
          global_warning_pct: Number(warningPct),
          global_critical_pct: Number(criticalPct),
        },
        notifications: {
          email_enabled: emailEnabled,
          alert_email: alertEmail,
          slack_enabled: slackEnabled,
          slack_channel: slackChannel,
          webhook_enabled: webhookEnabled,
          webhook_url: webhookUrl,
        },
        telemetry_sync: {
          frequency: syncFrequency,
        },
      };

      const res = await api.settings.update(payload);
      if (res.data?.success) {
        toast.success('System settings saved and propagated!');
        fetchSettings();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-400" />
            System Settings & Administration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure automated quota thresholds, multi-channel notification webhooks, sync schedules, and IAM role governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !isAdmin}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
              isAdmin
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>
            You are viewing settings with the <strong>{userRole}</strong> role. Only <strong>Admin</strong> users can modify and commit configuration changes.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'thresholds', label: 'Threshold Rules', icon: Sliders },
          { id: 'notifications', label: 'Notification Channels', icon: Bell },
          { id: 'sync', label: 'Sync Schedules', icon: Clock },
          { id: 'iam', label: 'IAM & Governance', icon: Shield },
          { id: 'audit', label: 'Audit Trail', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Thresholds Panel */}
      {activeTab === 'thresholds' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Global Saturation Thresholds
            </h3>
            <p className="text-xs text-slate-400">
              Set the organization-wide baseline utilization trigger levels for early warning alerts and high-risk escalation.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-400">Warning Threshold (%):</span>
                  <span className="text-white font-mono">{warningPct}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={warningPct}
                  disabled={!isAdmin}
                  onChange={(e) => setWarningPct(e.target.value)}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">Triggers cautionary notifications to engineering team</span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-red-400">Critical Threshold (%):</span>
                  <span className="text-white font-mono">{criticalPct}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="99"
                  value={criticalPct}
                  disabled={!isAdmin}
                  onChange={(e) => setCriticalPct(e.target.value)}
                  className="w-full accent-red-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">Triggers urgent priority alerts and recommends proactive quota increases</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400" />
              Service-Specific Overrides
            </h3>
            <p className="text-xs text-slate-400">
              Custom policies tailored for high-volatility Google Cloud API metrics.
            </p>
            <div className="space-y-2.5">
              {[
                { svc: 'Compute Engine (compute.googleapis.com)', warn: '70%', crit: '85%' },
                { svc: 'Cloud Storage (storage.googleapis.com)', warn: '80%', crit: '95%' },
                { svc: 'Vertex AI (aiplatform.googleapis.com)', warn: '65%', crit: '80%' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-200">{item.svc}</span>
                  <div className="flex gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">{item.warn}</span>
                    <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">{item.crit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {activeTab === 'notifications' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 max-w-3xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            Multi-Channel Incident Dispatch
          </h3>

          <div className="space-y-4">
            {/* Email */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Email Digest & Alerts</span>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  disabled={!isAdmin}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="rounded accent-blue-500"
                />
              </div>
              <input
                type="email"
                value={alertEmail}
                disabled={!isAdmin || !emailEnabled}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="ops-alerts@enterprise.org"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Slack */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Slack Alerts Channel</span>
                <input
                  type="checkbox"
                  checked={slackEnabled}
                  disabled={!isAdmin}
                  onChange={(e) => setSlackEnabled(e.target.checked)}
                  className="rounded accent-blue-500"
                />
              </div>
              <input
                type="text"
                value={slackChannel}
                disabled={!isAdmin || !slackEnabled}
                onChange={(e) => setSlackChannel(e.target.value)}
                placeholder="#gcp-quota-alerts"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Webhook */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Outbound Webhook URL</span>
                <input
                  type="checkbox"
                  checked={webhookEnabled}
                  disabled={!isAdmin}
                  onChange={(e) => setWebhookEnabled(e.target.checked)}
                  className="rounded accent-blue-500"
                />
              </div>
              <input
                type="url"
                value={webhookUrl}
                disabled={!isAdmin || !webhookEnabled}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/api/webhook"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sync Schedules */}
      {activeTab === 'sync' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 max-w-2xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Telemetry Ingestion Cadence
          </h3>
          <p className="text-xs text-slate-400">
            Configure how frequently the control plane polls Google Cloud Quotas and Cloud Monitoring APIs.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'MANUAL', label: 'Manual Only', desc: 'Sync only upon user trigger' },
              { id: 'HOURLY', label: 'Hourly Polling', desc: 'Sync every 60 minutes automatically' },
              { id: 'DAILY', label: 'Daily Batch', desc: 'Sync once per day at 00:00 UTC' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => isAdmin && setSyncFrequency(opt.id)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  syncFrequency === opt.id
                    ? 'border-emerald-500 bg-emerald-950/20 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white mb-1">{opt.label}</div>
                <div className="text-[11px] text-slate-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* IAM Governance */}
      {activeTab === 'iam' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            IAM Role Mapping & Service Account Bindings
          </h3>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-2">
            <p className="text-slate-400 font-semibold uppercase">Configured Principal:</p>
            <p className="text-blue-400 font-bold">quota-manager-sa@enterprise-prod-finance-42.iam.gserviceaccount.com</p>
            <div className="pt-2 text-slate-300 space-y-1">
              <p>&bull; roles/servicemanagement.quotaViewer (Quota limits discovery)</p>
              <p>&bull; roles/servicemanagement.quotaAdmin (Quota request submission)</p>
              <p>&bull; roles/monitoring.viewer (Metric utilization timeseries)</p>
              <p>&bull; roles/cloudquotas.admin (Target allocation updates)</p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Administrative Change History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 px-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-200">{log.changed_by}</td>
                    <td className="py-2 px-3 text-blue-400 font-semibold">{log.role}</td>
                    <td className="py-2 px-3 text-amber-300">{log.action}</td>
                    <td className="py-2 px-3 text-slate-400">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
