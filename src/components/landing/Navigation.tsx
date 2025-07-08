import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { useAppSelector } from '@/store';
import Image from 'next/image';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false); // Close mobile menu after clicking
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActivePage = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/home';
    }
    return pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <Container>
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link
            href={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center space-x-3 hover-lift"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              <Image
                src="/images/logo.png"
                alt="Intervio Logo"
                width={40}
                height={40}
                objectFit="contain"
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent text-2xl">
              Intervio
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Home Link */}
            {pathname === '/' ? (
              <button
                onClick={() => scrollToSection('hero')}
                className={`px-5 py-2.5 rounded-full font-medium transition-all hover:bg-primary/90 hover:shadow-lg text-sm ${
                  isActivePage('/')
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Home
              </button>
            ) : (
              <Link
                href="/"
                className={`px-5 py-2.5 rounded-full font-medium transition-all hover:bg-primary/90 hover:shadow-lg text-sm ${
                  isActivePage('/')
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
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
                <svg
                  className="w-3 h-3 transform group-hover:rotate-180 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
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
                isActivePage('/pricing')
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
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
              <Link href="/dashboard">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/signin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600 border-gray-300 hover:border-primary hover:text-primary"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
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
                    isActivePage('/')
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  Home
                </button>
              ) : (
                <Link
                  href="/"
                  className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                    isActivePage('/')
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-50'
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

              {/* Mobile Why Choose Link */}
              {pathname === '/' ? (
                <button
                  onClick={() => scrollToSection('why-choose')}
                  className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all"
                >
                  Why Choose Us
                </button>
              ) : (
                <Link
                  href="/#why-choose"
                  className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Why Choose Us
                </Link>
              )}

              {/* Mobile Pricing Link */}
              <Link
                href="/pricing"
                className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                  isActivePage('/pricing')
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
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
                  <Link
                    href="/dashboard"
                    className="block w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all text-sm">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/signin"
                      className="block w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button
                        variant="outline"
                        className="w-full text-gray-600 border-gray-300 hover:border-primary hover:text-primary px-6 py-3 rounded-full"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      href="/signup"
                      className="block w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all text-sm">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
}
