import React from 'react';
import { ArrowUpRight, ArrowDownRight, AlertCircle, ShieldAlert } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  onClick,
}) {
  const variantStyles = {
    default: {
      border: 'border-slate-800/80 hover:border-slate-700',
      badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      glow: 'group-hover:shadow-blue-500/5',
      text: 'text-white',
    },
    danger: {
      border: 'border-red-500/40 bg-red-950/20 hover:border-red-500/60',
      badge: 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse',
      glow: 'shadow-lg shadow-red-500/10',
      text: 'text-red-400',
    },
    warning: {
      border: 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500/60',
      badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      glow: 'shadow-lg shadow-amber-500/10',
      text: 'text-amber-400',
    },
    success: {
      border: 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500/60',
      badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      glow: 'shadow-lg shadow-emerald-500/10',
      text: 'text-emerald-400',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${style.border} ${style.glow} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-3xl font-extrabold tracking-tight ${style.text}`}>
              {value}
            </h3>
            {trend && (
              <span className="text-xs font-medium text-slate-400 flex items-center">
                {trend}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${style.badge}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
          <span>{subtitle}</span>
          {variant === 'danger' && (
            <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> High Urgency
            </span>
          )}
        </div>
      )}
    </div>
  );
}
