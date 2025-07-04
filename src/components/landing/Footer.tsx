import Link from 'next/link';
import { SparklesIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

export default function Footer() {
  return (
    <footer className="relative z-10 py-12 bg-gray-900 text-white">
      <Container>
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-primary">Intervio</span>
            </div>
            <p className="text-gray-400 mb-5 max-w-md text-sm">
              Our advanced artificial intelligence platform combines cutting-edge technologies to streamline your talent selection process, making hiring faster and more accurate than ever before.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white text-xs">
                Privacy Policy
              </Button>
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white text-xs">
                Terms of Service
              </Button>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Company</h4>
            <div className="space-y-2">
              <Link href="/about" className="block text-gray-400 hover:text-white transition-colors text-sm">About Us</Link>
              <Link href="/careers" className="block text-gray-400 hover:text-white transition-colors text-sm">Careers</Link>
              <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors text-sm">Contact</Link>
              <Link href="/blog" className="block text-gray-400 hover:text-white transition-colors text-sm">Blog</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Contact Us</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <p>+1 (555) 123-4567</p>
              <p>hello@intervio.com</p>
              <p>123 Business Ave<br />Suite 100<br />San Francisco, CA 94102</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>© 2024 Intervio. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
} 