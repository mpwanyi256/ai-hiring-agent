import { useState } from 'react';
import Link from 'next/link';
import { SparklesIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <Container>
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover-lift">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Intervio
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button 
              onClick={() => scrollToSection('hero')}
              className="px-5 py-2.5 rounded-full bg-primary text-white font-medium transition-all hover:bg-primary/90 hover:shadow-lg text-sm"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm"
            >
              Features
            </button>
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
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                  >
                    AI Assessments
                  </button>
                  <button 
                    onClick={() => scrollToSection('features')}
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
                </div>
              </div>
            </div>
            <Link href="/pricing" className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm">
              Pricing
            </Link>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm"
            >
              Testimonials
            </button>
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden md:block">
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm">
                Start Interview
              </Button>
            </Link>
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
              <button 
                onClick={() => scrollToSection('hero')}
                className="block w-full text-left px-4 py-3 rounded-lg bg-primary text-white font-medium transition-all"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('why-choose')}
                className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all"
              >
                Why Choose Us
              </button>
              <Link href="/pricing" className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all">
                Pricing
              </Link>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="block w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all"
              >
                Testimonials
              </button>
              <div className="pt-2 border-t border-gray-200">
                <Link href="/signup" className="block w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all text-sm">
                    Start Interview
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
} 