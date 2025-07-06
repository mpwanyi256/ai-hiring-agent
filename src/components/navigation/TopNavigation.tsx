'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { signOut } from '@/store/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  SparklesIcon,
  CogIcon,
  UserIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { app } from '@/lib/constants';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const isActivePage = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/home';
    }
    return pathname === path;
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`border-b border-surface bg-white shadow-sm sticky top-0 z-50 ${isDashboardPage ? '' : 'fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100'}`}>
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
            <Link href="/" className="flex items-center space-x-2 ml-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                <Image src="/images/logo.png" alt="Intervio Logo" width={40} height={40} objectFit="contain" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent text-2xl">
                {app.name}
              </span>
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
        // Landing page layout matching Navigation component
        <Container>
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-3 hover-lift">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                <Image src="/images/logo.png" alt="Intervio Logo" width={40} height={40} objectFit="contain" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent text-2xl">
                {app.name}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Home Link */}
              {pathname === '/' ? (
                <button 
                  onClick={() => scrollToSection('hero')}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all hover:bg-primary/90 hover:shadow-lg text-sm ${
                    isActivePage('/') ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  Home
                </button>
              ) : (
                <Link 
                  href="/"
                  className={`px-5 py-2.5 rounded-full font-medium transition-all hover:bg-primary/90 hover:shadow-lg text-sm ${
                    isActivePage('/') ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  Home
                </Link>
              )}

              {/* Features Link */}
              {pathname === '/' ? (
                <button 
                  onClick={() => scrollToSection('features')}
                  className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm"
                >
                  Features
                </button>
              ) : (
                <Link 
                  href="/#features"
                  className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm"
                >
                  Features
                </Link>
              )}

              {/* Solutions Dropdown */}
              <div className="relative group">
                <button className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all flex items-center space-x-1 text-sm">
                  <span>Solutions</span>
                  <svg className="w-3 h-3 transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Dropdown menu */}
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2">
                    {pathname === '/' ? (
                      <>
                        <button 
                          onClick={() => scrollToSection('features')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                        >
                          AI Assessments
                        </button>
                        <button 
                          onClick={() => scrollToSection('why-choose')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                        >
                          Behavioral Analysis
                        </button>
                        <button 
                          onClick={() => scrollToSection('why-choose')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                        >
                          Real-time Feedback
                        </button>
                      </>
                    ) : (
                      <>
                        <Link 
                          href="/#features"
                          className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                        >
                          AI Assessments
                        </Link>
                        <Link 
                          href="/#why-choose"
                          className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                        >
                          Behavioral Analysis
                        </Link>
                        <Link 
                          href="/#why-choose"
                          className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                        >
                          Real-time Feedback
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Link */}
              <Link 
                href="/pricing" 
                className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm ${
                  isActivePage('/pricing') ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Pricing
              </Link>

              {/* Testimonials Link */}
              {pathname === '/' ? (
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm"
                >
                  Testimonials
                </button>
              ) : (
                <Link 
                  href="/#testimonials"
                  className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm"
                >
                  Testimonials
                </Link>
              )}
            </div>

            {/* Desktop CTA Button */}
            <div className="hidden md:block">
              {isLoading ? (
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : isAuthenticated ? (
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
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-muted-text text-xs truncate max-w-[120px]">
                          {user?.companyName}
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
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-muted-text text-xs">{user?.email}</p>
                        <p className="text-muted-text text-xs">{user?.companyName}</p>
                        <p className="text-muted-text text-xs capitalize mt-1">
                          {user?.subscription?.name || 'Free'} Plan
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
                <div className="flex items-center space-x-2">
                  <Link href="/signin">
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:border-primary hover:text-primary">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm">
                      Start Interview
                    </Button>
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Mobile Menu Button */}
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

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-lg">
              <div className="p-4 space-y-4">
                {/* Mobile Home Link */}
                {pathname === '/' ? (
                  <button 
                    onClick={() => scrollToSection('hero')}
                    className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                      isActivePage('/') ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    }`}
                  >
                    Home
                  </button>
                ) : (
                  <Link 
                    href="/"
                    className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                      isActivePage('/') ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                )}

                {/* Mobile Features Link */}
                {pathname === '/' ? (
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all"
                  >
                    Features
                  </button>
                ) : (
                  <Link 
                    href="/#features"
                    className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                )}

                {/* Mobile Pricing Link */}
                <Link 
                  href="/pricing" 
                  className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                    isActivePage('/pricing') ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>

                {/* Mobile Testimonials Link */}
                {pathname === '/' ? (
                  <button 
                    onClick={() => scrollToSection('testimonials')}
                    className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all"
                  >
                    Testimonials
                  </button>
                ) : (
                  <Link 
                    href="/#testimonials"
                    className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Testimonials
                  </Link>
                )}

                {/* Mobile CTA */}
                <div className="pt-2 border-t border-gray-200">
                  {isLoading ? (
                    <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                  ) : isAuthenticated ? (
                    <Link href="/dashboard" className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all text-sm">
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : showAuthButtons ? (
                    <div className="space-y-2">
                      <Link href="/signin" className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full text-gray-600 border-gray-300 hover:border-primary hover:text-primary px-6 py-3 rounded-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup" className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all text-sm">
                          Start Interview
                        </Button>
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </Container>
      )}
    </header>
  );
} 