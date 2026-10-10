import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QuotaExplorer from './pages/QuotaExplorer';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('Admin');
  const [environment, setEnvironment] = useState('PRODUCTION');
  const [selectedProject, setSelectedProject] = useState('enterprise-prod-finance-42');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock baseline data until centralized API client connects
  const [quotas, setQuotas] = useState([
    { id: 'qm-001', project_id: 'enterprise-prod-finance-42', metric_name: 'compute.googleapis.com/cpus', region: 'us-central1', current_usage: 104.0, quota_limit: 128.0, utilization_percentage: 81.25 },
    { id: 'qm-002', project_id: 'enterprise-prod-finance-42', metric_name: 'compute.googleapis.com/nvidia_h100_gpus', region: 'us-central1', current_usage: 15.0, quota_limit: 16.0, utilization_percentage: 93.75 },
    { id: 'qm-003', project_id: 'enterprise-prod-finance-42', metric_name: 'compute.googleapis.com/disks_total_storage_gb', region: 'us-central1', current_usage: 34200.0, quota_limit: 65536.0, utilization_percentage: 52.19 },
    { id: 'qm-004', project_id: 'enterprise-prod-finance-42', metric_name: 'compute.googleapis.com/in_use_addresses', region: 'us-central1', current_usage: 22.0, quota_limit: 25.0, utilization_percentage: 88.0 },
    { id: 'qm-005', project_id: 'enterprise-staging-services-18', metric_name: 'compute.googleapis.com/cpus', region: 'europe-west1', current_usage: 45.0, quota_limit: 100.0, utilization_percentage: 45.0 },
  ]);

  const [requests, setRequests] = useState([
    { id: 'req-001', quota_metric_id: 'qm-001', requested_by: 'lead.architect@enterprise.org', current_limit: 128.0, requested_limit: 200.0, business_justification: 'Quarterly transaction surge preparation', status: 'PENDING', created_at: new Date().toISOString() },
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/quotas');
      if (res.ok) {
        const json = await res.json();
        if (json.data) setQuotas(json.data);
      }
    } catch (e) {
      // offline fallback
    } finally {
      setIsRefreshing(false);
      toast.success('GCP Quota Telemetry refreshed');
    }
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
        pendingCount={requests.filter(r => r.status === 'PENDING').length}
        atRiskCount={quotas.filter(q => q.utilization_percentage >= 80).length}
        onRefreshTelemetry={handleRefresh}
        isRefreshing={isRefreshing}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            quotas={quotas}
            requests={requests}
            selectedProject={selectedProject}
            onNavigateToQuotas={() => setActiveTab('quotas')}
            onNavigateToApprovals={() => setActiveTab('approvals')}
            onRequestIncrease={(item) => {
              setActiveTab('quotas');
            }}
          />
        )}

        {activeTab === 'quotas' && (
          <QuotaExplorer
            quotas={quotas}
            onRequestIncrease={(item) => {
              // Open modal
            }}
          />
        )}
      </Layout>
    </>
  );
}
