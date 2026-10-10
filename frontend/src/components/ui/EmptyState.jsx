import React from 'react';
import { Layers } from 'lucide-react';

export default function EmptyState({
  title = 'No Data Available',
  description = 'No records match the current criteria or filters.',
  icon: Icon = Layers,
  action,
}) {
  return (
    <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800/80 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 mb-4">{description}</p>
      {action}
    </div>
  );
}
