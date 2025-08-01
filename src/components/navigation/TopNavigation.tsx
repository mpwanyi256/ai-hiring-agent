'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Container from '@/components/ui/Container';
import { useAppDispatch, useAppSelector } from '@/store';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { fetchCompanyData, fetchTimezones } from '@/store/company/companyThunks';
import Logo from './Logo';
import NavigationLinks from './NavigationLinks';
import AuthButtons from './AuthButtons';
import UserDropdown from './UserDropdown';
import MobileMenu from './MobileMenu';
import DashboardNavigation from './DashboardNavigation';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface TopNavigationProps {
  showAuthButtons?: boolean;
  onMobileMenuClick?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export default function TopNavigation({
  showAuthButtons = true,
  onToggleSidebar,
  sidebarCollapsed = false,
}: TopNavigationProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.companyId) {
      // Load company data and timezones
      dispatch(fetchCompanyData());
      dispatch(fetchTimezones());
    }
  }, [isAuthenticated, user, dispatch]);

  // Determine if we're on a dashboard page
  const isDashboardPage = pathname.startsWith('/dashboard');

  return (
    <header
      className={`border-b border-surface bg-white shadow-sm sticky top-0 z-50 ${isDashboardPage ? '' : 'fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100'}`}
    >
      {isDashboardPage ? (
        // Use DashboardNavigation for dashboard pages
        <DashboardNavigation
          onToggleSidebar={onToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
      ) : (
        // Landing page layout
        <Container>
          <div className="flex items-center justify-between h-16">
            <Logo />

            <div className="hidden md:flex items-center space-x-8">
              <NavigationLinks />
            </div>
            <div className="hidden md:flex items-center gap-2">
              {isLoading ? (
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : isAuthenticated && user ? (
                <>
                  <NotificationDropdown />
                  <UserDropdown />
                </>
              ) : showAuthButtons ? (
                <AuthButtons variant="desktop" />
              ) : null}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 transition-all"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>

          <MobileMenu
            isOpen={isMobileMenuOpen}
            showAuthButtons={showAuthButtons}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        </Container>
      )}
    </header>
  );
}
