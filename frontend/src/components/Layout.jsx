import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({
  children,
  activeTab,
  setActiveTab,
  pendingCount,
  atRiskCount,
  selectedProject,
  setSelectedProject,
  projects,
  userRole,
  setUserRole,
  environment,
  setEnvironment,
  onRefreshTelemetry,
  isRefreshing,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Fixed Vertical Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        atRiskCount={atRiskCount}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        projects={projects}
        userRole={userRole}
      />

      {/* Main Content Area with Fixed Navbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTab={activeTab}
          userRole={userRole}
          setUserRole={setUserRole}
          environment={environment}
          setEnvironment={setEnvironment}
          onRefreshTelemetry={onRefreshTelemetry}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-8 ml-64 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
