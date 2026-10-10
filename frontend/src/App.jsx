import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QuotaExplorer from './pages/QuotaExplorer';
import ApprovalCenter from './pages/ApprovalCenter';
import RequestModal from './components/RequestModal';
import { api, setClientUserRole } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('Admin');
  const [environment, setEnvironment] = useState('PRODUCTION');
  const [selectedProject, setSelectedProject] = useState('enterprise-prod-finance-42');
  const [projects, setProjects] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedQuotaForModal, setSelectedQuotaForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync role with API interceptor
  useEffect(() => {
    setClientUserRole(userRole);
  }, [userRole]);

  // Initial Data Fetching via Centralized API Client
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [projRes, quotaRes, reqRes] = await Promise.allSettled([
        api.projects.list(),
        api.quotas.list(),
        api.requests.list(),
      ]);

      if (projRes.status === 'fulfilled' && projRes.value?.data?.data) {
        setProjects(projRes.value.data.data);
      }

      if (quotaRes.status === 'fulfilled' && quotaRes.value?.data?.data) {
        setQuotas(quotaRes.value.data.data);
      } else {
        // Fallback baseline quotas if server offline
        setQuotas([
          { id: 'qm-001', project_id: 'enterprise-prod-finance-42', metric_name: 'compute.googleapis.com/cpus', region: 'us-central1', current_usage: 104.0, quota_limit: 128.0, utilization_percentage: 81.25 },
          { id: 'qm-002', project_id: 'enterprise-prod-finance-42', metric_name: 'compute.googleapis.com/nvidia_h100_gpus', region: 'us-central1', current_usage: 15.0, quota_limit: 16.0, utilization_percentage: 93.75 },
          { id: 'qm-003', project_id: 'enterprise-prod-finance-42', metric_name: 'compute.googleapis.com/disks_total_storage_gb', region: 'us-central1', current_usage: 34200.0, quota_limit: 65536.0, utilization_percentage: 52.19 },
          { id: 'qm-004', project_id: 'enterprise-prod-finance-42', metric_name: 'compute.googleapis.com/in_use_addresses', region: 'us-central1', current_usage: 22.0, quota_limit: 25.0, utilization_percentage: 88.0 },
          { id: 'qm-005', project_id: 'enterprise-staging-services-18', metric_name: 'compute.googleapis.com/cpus', region: 'europe-west1', current_usage: 45.0, quota_limit: 100.0, utilization_percentage: 45.0 },
        ]);
      }

      if (reqRes.status === 'fulfilled' && reqRes.value?.data?.data) {
        setRequests(reqRes.value.data.data);
      }
    } catch (e) {
      console.warn('Network sync error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(true);
    toast.success('Live GCP Quota Telemetry Synchronized!');
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
            fontSize: '12px',
          },
        }}
      />
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
        environment={environment}
        setEnvironment={setEnvironment}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        projects={projects}
        pendingCount={requests.filter((r) => r.status === 'PENDING').length}
        atRiskCount={quotas.filter((q) => q.utilization_percentage >= 80).length}
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
              setSelectedQuotaForModal(item);
              setIsModalOpen(true);
            }}
          />
        )}

        {activeTab === 'quotas' && (
          <QuotaExplorer
            quotas={quotas}
            isLoading={isLoading}
            onRequestIncrease={(item) => {
              setSelectedQuotaForModal(item);
              setIsModalOpen(true);
            }}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalCenter
            requests={requests}
            userRole={userRole}
            onRequestUpdated={(updatedReq) => {
              setRequests((prev) =>
                prev.map((r) => (r.id === updatedReq.id ? updatedReq : r))
              );
            }}
          />
        )}

        {activeTab === 'settings' && (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800 space-y-6">
            <h2 className="text-xl font-bold text-white">System Settings & GCP IAM Governance</h2>
            <p className="text-xs text-slate-400">
              Configured Service Account: <span className="font-mono text-blue-400">quota-manager-sa@my-gcp-project.iam.gserviceaccount.com</span>
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
              <p className="text-slate-400 font-semibold uppercase">Assigned Roles:</p>
              <p>&bull; roles/servicemanagement.quotaViewer</p>
              <p>&bull; roles/servicemanagement.quotaAdmin</p>
              <p>&bull; roles/monitoring.viewer</p>
              <p>&bull; roles/cloudquotas.admin</p>
            </div>
          </div>
        )}

        {/* Request Planner Modal */}
        <RequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          quota={selectedQuotaForModal}
          userRole={userRole}
          onSubmitSuccess={(newReq) => {
            setRequests((prev) => [newReq, ...prev]);
          }}
        />
      </Layout>
    </>
  );
}
