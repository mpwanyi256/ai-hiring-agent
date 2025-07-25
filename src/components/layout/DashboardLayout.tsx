'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import TopNavigation from '@/components/navigation/TopNavigation';
import Sidebar from './Sidebar';
import { LoadingOverlay } from '../generics/LoadingOverlay';
import SidePanel from '@/components/ui/SidePanel';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  loading?: boolean;
  loadingMessage?: string;
  requireSubscription?: boolean;
  className?: string;
}

export default function DashboardLayout({
  children,
  title,
  loading,
  loadingMessage,
  className,
}: DashboardLayoutProps) {
  // Always call hooks at the top level
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);

  const hasActiveSubscription =
    user?.subscription && ['active', 'trialing'].includes(user.subscription.status);

  // Render loading state
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

  // Render nothing if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Create dashboard content
  const dashboardContent = (
    <div className={`h-screen bg-background flex flex-col overflow-hidden ${className}`}>
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
            onSubscribeClick={() => setShowSubscriptionPanel(true)}
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
            onSubscribeClick={() => setShowSubscriptionPanel(true)}
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

        {/* Subscription SidePanel for Unsubscribed Users */}
        <SidePanel
          isOpen={!hasActiveSubscription && showSubscriptionPanel}
          onClose={() => setShowSubscriptionPanel(false)}
          title="Subscription Required"
          width="md"
        >
          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-900 mb-2">Unlock Full Access</p>
            <p className="text-gray-700 mb-4">
              Subscribe to a plan to create jobs, manage candidates, and access all features of the
              dashboard.
            </p>
            <ul className="mb-6 space-y-2 text-sm text-gray-700">
              <li>• AI-powered candidate evaluation</li>
              <li>• 30-day free trial on all plans</li>
              <li>• Cancel anytime, no long-term commitment</li>
              <li>• Priority support and analytics</li>
            </ul>
            <a href="/pricing" className="inline-block w-full">
              <button className="w-full px-4 py-2 bg-primary text-white rounded font-semibold hover:bg-primary/90 transition-all text-base flex items-center justify-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                View Pricing Plans
              </button>
            </a>
          </div>
        </SidePanel>
      </div>
    </div>
  );

  // Return dashboard content for all users (no SubscriptionRequired wrapper)
  return dashboardContent;
}
