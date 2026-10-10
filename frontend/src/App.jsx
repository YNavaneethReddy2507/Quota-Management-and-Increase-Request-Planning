import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Toaster position="top-right" />
      <header className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
          Google Cloud Quota Control Plane
        </h1>
        <div className="text-xs text-slate-400">Environment: PRODUCTION</div>
      </header>
      <main className="flex-1 p-6">
        <p className="text-slate-400">Initializing Control Plane modules...</p>
      </main>
    </div>
  );
}
