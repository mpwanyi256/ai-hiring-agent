'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { signOut } from '@/store/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/auth/authSlice';
import { logoutThunk } from '@/store/auth/authThunks';
import { 
  SparklesIcon,
  CogIcon,
  UserIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface TopNavigationProps {
  showAuthButtons?: boolean;
  onMobileMenuClick?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export default function TopNavigation({ 
  showAuthButtons = true, 
  onMobileMenuClick,
  onToggleSidebar,
  sidebarCollapsed = false
}: TopNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      setShowDropdown(false);
      await dispatch(signOut()).unwrap();
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Determine if we're on a dashboard page
  const isDashboardPage = pathname.startsWith('/dashboard');

  return (
    <header className="border-b border-surface bg-white shadow-sm sticky top-0 z-50">
      {isDashboardPage ? (
        // Dashboard layout - more compact with better spacing
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left Section - Dashboard */}
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Button */}
            {onMobileMenuClick && (
              <button
                onClick={onMobileMenuClick}
                className="lg:hidden p-2 rounded-lg text-muted-text hover:text-text hover:bg-gray-50 transition-colors"
                aria-label="Open menu"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
            )}

            {/* Desktop Sidebar Toggle */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden lg:flex p-2 rounded-lg text-muted-text hover:text-text hover:bg-gray-50 transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon className="w-4 h-4" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Logo - Compact for dashboard */}
            <Link href="/dashboard" className="flex items-center space-x-2 ml-2">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-primary hidden sm:block">AI Hiring Agent</span>
            </Link>
          </div>

          {/* Right Section - Dashboard */}
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="relative" data-dropdown>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="hidden md:block">
                      <p className="font-medium text-text text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-muted-text text-xs truncate max-w-[100px]">
                        {user.companyName}
                      </p>
                    </div>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-muted-text hidden md:block" />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-light z-50">
                    <div className="p-4 border-b border-gray-light">
                      <p className="font-medium text-text text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-muted-text text-xs">{user.email}</p>
                      <p className="text-muted-text text-xs">{user.companyName}</p>
                      <p className="text-muted-text text-xs capitalize mt-1">
                        {user.subscription?.name || 'Free'} Plan
                      </p>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50"
                        onClick={() => setShowDropdown(false)}
                      >
                        <SparklesIcon className="w-4 h-4 mr-3 text-muted-text" />
                        Dashboard
                      </Link>
                      
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50"
                        onClick={() => setShowDropdown(false)}
                      >
                        <CogIcon className="w-4 h-4 mr-3 text-muted-text" />
                        Settings
                      </Link>
                      
                      <div className="border-t border-gray-light my-1"></div>
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-accent-red hover:bg-gray-50"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        // Regular layout for non-dashboard pages
        <Container>
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Left Section */}
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-primary">AI Hiring Agent</span>
              </Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                // Loading state - show skeleton
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : isAuthenticated && user ? (
                // Authenticated user menu
                <div className="relative" data-dropdown>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 sm:space-x-3 text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="hidden sm:block">
                        <p className="font-medium text-text text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-muted-text text-xs truncate max-w-[120px]">
                          {user.companyName}
                        </p>
                      </div>
                    </div>
                    <ChevronDownIcon className="w-4 h-4 text-muted-text hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-light z-50">
                      <div className="p-4 border-b border-gray-light">
                        <p className="font-medium text-text text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-muted-text text-xs">{user.email}</p>
                        <p className="text-muted-text text-xs">{user.companyName}</p>
                        <p className="text-muted-text text-xs capitalize mt-1">
                          {user.subscription?.name || 'Free'} Plan
                        </p>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50"
                          onClick={() => setShowDropdown(false)}
                        >
                          <SparklesIcon className="w-4 h-4 mr-3 text-muted-text" />
                          Dashboard
                        </Link>
                        
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50"
                          onClick={() => setShowDropdown(false)}
                        >
                          <CogIcon className="w-4 h-4 mr-3 text-muted-text" />
                          Settings
                        </Link>
                        
                        <div className="border-t border-gray-light my-1"></div>
                        
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-accent-red hover:bg-gray-50"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : showAuthButtons ? (
                // Unauthenticated state - show auth buttons
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Link href="/signin">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      )}
    </header>
  );
} 