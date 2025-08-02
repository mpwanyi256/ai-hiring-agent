import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store';
import AuthButtons from './AuthButtons';

interface MobileMenuProps {
  isOpen: boolean;
  showAuthButtons: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, showAuthButtons, onClose }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const pathname = usePathname();

  const isActivePage = (path: string): boolean => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
            onClick={onClose}
          >
            Features
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
          onClick={onClose}
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
            onClick={onClose}
          >
            Testimonials
          </Link>
        )}

        {/* Mobile CTA */}
        <div className="pt-2 border-t border-gray-200">
          {isLoading ? (
            <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
          ) : isAuthenticated ? (
            <Link href="/dashboard" className="block w-full" onClick={onClose}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all text-sm">
                Go to Dashboard
              </Button>
            </Link>
          ) : showAuthButtons ? (
            <AuthButtons variant="mobile" onLinkClick={onClose} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
