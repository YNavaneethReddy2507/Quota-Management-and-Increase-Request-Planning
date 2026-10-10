import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';

export default function ApprovalCenter({
  requests = [],
  onRequestUpdated,
  userRole = 'Admin',
  apiBaseUrl = 'http://localhost:5000/api/v1',
}) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'APPROVE' | 'REJECT' | null
  const [adminComments, setAdminComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'HISTORY'

  // If not Admin, show restricted screen
  if (userRole !== 'Admin') {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Administrator Access Required</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          The Approval Center enforces strict Role-Based Access Control (RBAC). Only users with the <span className="text-amber-400 font-semibold">Admin</span> role can review and provision Google Cloud Quota increases.
        </p>
        <p className="text-xs text-slate-500">
          Tip: You can switch to the Admin role using the navbar role switcher at the top right.
        </p>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const historicalRequests = requests.filter((r) => r.status !== 'PENDING');
  const displayedRequests = activeTab === 'PENDING' ? pendingRequests : historicalRequests;

  const handleOpenActionDialog = (req, action) => {
    setSelectedRequest(req);
    setConfirmAction(action);
    setAdminComments(action === 'APPROVE' ? 'Approved for production capacity expansion.' : '');
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setConfirmAction(null);
    setAdminComments('');
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !confirmAction) return;

    if (confirmAction === 'REJECT' && (!adminComments.trim() || adminComments.trim().length < 5)) {
      toast.error('Rejection reason must be at least 5 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      const endpoint = `${apiBaseUrl}/requests/${selectedRequest.id}/${confirmAction.toLowerCase()}`;
      const payload = { admin_comments: adminComments.trim() };

      const response = await axios.patch(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
        },
      });

      if (response.data && response.data.success) {
        toast.success(
          confirmAction === 'APPROVE'
            ? 'Request Approved & submitted to GCP Cloud Quotas API!'
            : 'Request Rejected successfully.'
        );
        if (onRequestUpdated) {
          onRequestUpdated(response.data.data);
        }
        handleCloseDialog();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Action failed';
      toast.error(`Action failed: ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Internal Approval Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise governance plane for reviewing, justifying, and provisioning GCP Cloud Quota increases.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'PENDING'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono flex items-center justify-center border border-amber-500/40">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Decision Audit History ({historicalRequests.length})
          </button>
        </div>
      </div>

      {/* Requests Feed */}
      {displayedRequests.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800/80">
          <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {activeTab === 'PENDING' ? 'No Pending Requests' : 'No Past Requests Recorded'}
          </h3>
          <p className="text-xs text-slate-400">
            {activeTab === 'PENDING'
              ? 'All incoming quota increase requests have been processed.'
              : 'Decisions and audit trail will populate here as requests are approved or rejected.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedRequests.map((req) => (
            <div
              key={req.id}
              className="glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-slate-700/80 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                      Request #{req.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        req.status === 'APPROVED' || req.status === 'GCP_FULFILLED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'REJECTED' || req.status === 'FAILED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : req.status === 'GCP_SUBMITTED'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Requested by: <strong className="text-slate-200">{req.requested_by}</strong>
                    </span>
                  </div>

                  {/* Limit Comparison */}
                  <div className="flex items-center gap-4 text-sm font-mono">
                    <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase">Current Limit</span>
                      <span className="text-slate-300 font-bold">{req.current_limit}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <div className="bg-blue-950/30 px-3 py-1.5 rounded-xl border border-blue-500/30">
                      <span className="text-[10px] text-blue-400 block uppercase">Proposed Limit</span>
                      <span className="text-blue-300 font-bold">
                        {req.requested_limit}{' '}
                        <span className="text-xs font-normal text-emerald-400">
                          (+{Math.round(((req.requested_limit - req.current_limit) / req.current_limit) * 100)}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Justification Quote */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                      Business Justification
                    </span>
                    <p className="text-slate-300 italic">"{req.business_justification}"</p>
                  </div>

                  {/* Admin Comments if present */}
                  {req.admin_comments && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/60 text-xs">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">
                        Admin Note
                      </span>
                      <p className="text-slate-200 font-mono text-[11px]">{req.admin_comments}</p>
                    </div>
                  )}
                </div>

                {/* Actions for PENDING requests: Large Distinct Buttons (Approve Green, Reject Red) */}
                {req.status === 'PENDING' && (
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[200px]">
                    <button
                      onClick={() => handleOpenActionDialog(req, 'APPROVE')}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve & Submit
                    </button>
                    <button
                      onClick={() => handleOpenActionDialog(req, 'REJECT')}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmAction && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                {confirmAction === 'APPROVE' ? (
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white">
                    {confirmAction === 'APPROVE'
                      ? 'Confirm Quota Increase Approval'
                      : 'Confirm Quota Increase Rejection'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Target Limit: {selectedRequest.requested_limit} (Old: {selectedRequest.current_limit})
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDialog}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmAction === 'APPROVE'
                  ? 'Approving this request will immediately trigger an authenticated mutation call to the GCP Cloud Quotas API (quotaPreferences endpoint) with automated retry resilience.'
                  : 'Rejecting this request will mark it as REJECTED in the database and notify the engineer. A clear rejection comment is required.'}
              </p>

              {/* Mandatory comments for REJECT, optional for APPROVE */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  {confirmAction === 'REJECT' ? 'Mandatory Rejection Comments *' : 'Approval Comments'}
                </label>
                <textarea
                  rows="3"
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  placeholder={
                    confirmAction === 'REJECT'
                      ? 'Explain why the quota increase cannot be granted at this time...'
                      : 'Optional comments for audit record...'
                  }
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all disabled:opacity-50 ${
                    confirmAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Executing Decision...
                    </>
                  ) : confirmAction === 'APPROVE' ? (
                    'Confirm & Provision'
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
