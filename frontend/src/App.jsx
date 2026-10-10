import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('Admin');
  const [environment, setEnvironment] = useState('PRODUCTION');
  const [selectedProject, setSelectedProject] = useState('enterprise-prod-finance-42');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' } }} />
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
        environment={environment}
        setEnvironment={setEnvironment}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        onRefreshTelemetry={handleRefresh}
        isRefreshing={isRefreshing}
      >
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-white mb-2">Google Cloud Quota Control Plane Active</h2>
          <p className="text-slate-400 text-sm">Layout Architecture initialized successfully. Proceeding to page components.</p>
        </div>
      </Layout>
    </>
  );
}
