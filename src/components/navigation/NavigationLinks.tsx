import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationLinksProps {
  className?: string;
  onLinkClick?: () => void;
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({ className = '', onLinkClick }) => {
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
    onLinkClick?.();
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Home Link */}
      {pathname === '/' ? (
        <button
          onClick={() => scrollToSection('hero')}
          className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm ${
            isActivePage('/')
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-600 hover:text-primary hover:bg-gray-50'
          }`}
        >
          Home
        </button>
      ) : (
        <Link
          href="/"
          className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm ${
            isActivePage('/')
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-600 hover:text-primary hover:bg-gray-50'
          }`}
          onClick={onLinkClick}
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
          onClick={onLinkClick}
        >
          Features
        </Link>
      )}

      {/* Pricing Link */}
      <Link
        href="/pricing"
        className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm ${
          isActivePage('/pricing')
            ? 'bg-primary text-white shadow-md'
            : 'text-gray-600 hover:text-primary hover:bg-gray-50'
        }`}
        onClick={onLinkClick}
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
          onClick={onLinkClick}
        >
          Testimonials
        </Link>
      )}
    </div>
  );
};

export default NavigationLinks;
