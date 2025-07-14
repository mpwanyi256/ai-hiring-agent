'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import TopNavigation from '@/components/navigation/TopNavigation';
import Sidebar from './Sidebar';
import { LoadingOverlay } from '../generics/LoadingOverlay';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  loading?: boolean;
  loadingMessage?: string;
}

export default function DashboardLayout({
  children,
  title,
  loading,
  loadingMessage,
}: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard content if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Centralized Top Navigation */}
      <TopNavigation
        showAuthButtons={true}
        onMobileMenuClick={() => setSidebarOpen(true)}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Dashboard Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Sidebar */}
        <div
          className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          }`}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar
            collapsed={false}
            onToggleCollapse={() => {}}
            onClose={() => setSidebarOpen(false)}
            isMobile={true}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Page Title (if provided) */}
          {title && (
            <div className="bg-white border-b border-surface px-4 sm:px-6 py-4">
              <h1 className="text-xl sm:text-2xl font-bold text-text">{title}</h1>
            </div>
          )}

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-4 sm:p-6">
              {loading ? <LoadingOverlay message={loadingMessage || 'Loading...'} /> : children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
