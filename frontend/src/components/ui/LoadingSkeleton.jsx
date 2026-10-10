import React from 'react';

export default function LoadingSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-800/80 rounded-lg"
          style={{ width: `${100 - i * 15}%` }}
        ></div>
      ))}
    </div>
  );
}
