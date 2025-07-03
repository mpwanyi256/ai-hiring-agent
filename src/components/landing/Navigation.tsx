import Link from 'next/link';
import { SparklesIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <Container>
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Intervio
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className="px-5 py-2.5 rounded-full bg-primary text-white font-medium transition-all hover:bg-primary/90 hover:shadow-lg text-sm">
              Home
            </Link>
            <Link href="/about" className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm">
              About Us
            </Link>
            <div className="relative group">
              <button className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all flex items-center space-x-1 text-sm">
                <span>Features</span>
                <svg className="w-3 h-3 transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <Link href="/pricing" className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm">
              Pricing
            </Link>
            <Link href="#testimonials" className="px-5 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all text-sm">
              Testimonial
            </Link>
          </div>

          {/* CTA Button */}
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm">
              Start Interview
            </Button>
          </Link>
        </div>
      </Container>
    </nav>
  );
} 