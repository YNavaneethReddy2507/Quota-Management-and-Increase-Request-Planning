import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  X,
  Send,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function RequestModal({
  isOpen,
  onClose,
  quota,
  onSubmitSuccess,
  apiBaseUrl = 'http://localhost:5000/api/v1',
  userRole = 'Admin',
}) {
  if (!isOpen || !quota) return null;

  const currentLimit = quota.quota_limit || 100;
  const currentUsage = quota.current_usage || 0;
  const currentUtil = quota.utilization_percentage || 0;

  const [requestedLimit, setRequestedLimit] = useState(Math.ceil(currentLimit * 1.5));
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Dynamic Confidence Preview Calculation
  const calculateLiveScore = () => {
    const numLimit = parseFloat(requestedLimit);
    if (isNaN(numLimit) || numLimit <= currentLimit) return 0;

    let utilScore = (currentUtil / 100) * 75;
    let multiplier = numLimit / currentLimit;
    let multScore = multiplier <= 3 ? 15 : multiplier <= 5 ? 10 : 5;
    let justScore = justification.length >= 50 ? 10 : justification.length >= 10 ? 5 : 0;

    return Math.min(100, Math.round(utilScore + multScore + justScore));
  };

  const liveScore = calculateLiveScore();

  // Validate form
  const validate = () => {
    const errs = {};
    const numLimit = parseFloat(requestedLimit);

    if (isNaN(numLimit)) {
      errs.requestedLimit = 'Requested limit must be a valid number.';
    } else if (numLimit <= currentLimit) {
      errs.requestedLimit = `Requested limit must be strictly greater than current limit (${currentLimit}).`;
    }

    if (!justification.trim()) {
      errs.justification = 'Business justification is required.';
    } else if (justification.trim().length < 10) {
      errs.justification = 'Justification must be at least 10 characters long.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        quota_metric_id: quota.id,
        requested_limit: parseFloat(requestedLimit),
        business_justification: justification.trim(),
        requested_by: userRole === 'Admin' ? 'lead.architect@enterprise.org' : 'developer@enterprise.org',
      };

      const response = await axios.post(`${apiBaseUrl}/requests`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
        },
      });

      if (response.data && response.data.success) {
        toast.success(`Request drafted successfully! Score: ${response.data.data.approval_confidence_score || liveScore}/100`);
        if (onSubmitSuccess) {
          onSubmitSuccess(response.data.data);
        }
        onClose();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to submit request';
      toast.error(`Submission failed: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Plan Quota Increase Request
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {quota.metric_name} &bull; <span className="text-blue-400">{quota.region}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Read-Only Current Telemetry Overview */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Usage</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{currentUsage}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Limit (Read-Only)</span>
              <span className="font-mono font-bold text-slate-300 text-sm">{currentLimit}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Utilization</span>
              <span className={`font-mono font-bold text-sm ${currentUtil >= 80 ? 'text-red-400' : 'text-amber-400'}`}>
                {currentUtil}%
              </span>
            </div>
          </div>

          {/* Requested Limit Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Target Quota Limit <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">Must exceed {currentLimit}</span>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={requestedLimit}
                onChange={(e) => setRequestedLimit(e.target.value)}
                className={`flex-1 bg-slate-950/80 border rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.requestedLimit ? 'border-red-500 focus:ring-red-500' : 'border-slate-700/80'
                }`}
              />
              {/* Quick Multiplier Presets */}
              {[1.5, 2.0, 3.0].map((mul) => (
                <button
                  type="button"
                  key={mul}
                  onClick={() => setRequestedLimit(Math.ceil(currentLimit * mul))}
                  className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  +{Math.round((mul - 1) * 100)}%
                </button>
              ))}
            </div>
            {errors.requestedLimit && (
              <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.requestedLimit}
              </p>
            )}
          </div>

          {/* Business Justification Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Business & Architecture Justification <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">
                {justification.length}/10 min chars
              </span>
            </div>
            <textarea
              rows="3"
              placeholder="State production workload, architecture justification, and projected capacity demand..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className={`w-full bg-slate-950/80 border rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.justification ? 'border-red-500 focus:ring-red-500' : 'border-slate-700/80'
              }`}
            ></textarea>
            {errors.justification && (
              <p className="text-[11px] text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.justification}
              </p>
            )}
          </div>

          {/* Live AI Risk & Confidence Score Preview */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Estimated Approval Confidence</p>
                <p className="text-[11px] text-slate-400">Calculated from 80% saturation threshold and expansion multiplier</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-base font-bold font-mono ${liveScore >= 80 ? 'text-emerald-400' : liveScore >= 50 ? 'text-amber-400' : 'text-slate-400'}`}>
                {liveScore}/100
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Increase Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
