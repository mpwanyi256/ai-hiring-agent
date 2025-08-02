import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AuthButtonsProps {
  variant?: 'desktop' | 'mobile';
  onLinkClick?: () => void;
  className?: string;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({
  variant = 'desktop',
  onLinkClick,
  className = '',
}) => {
  if (variant === 'mobile') {
    return (
      <div className={`space-y-2 ${className}`}>
        <Link href="/signin" className="block w-full" onClick={onLinkClick}>
          <Button
            variant="outline"
            className="w-full text-gray-600 border-gray-300 hover:border-primary hover:text-primary px-6 py-3 rounded-full"
          >
            Sign In
          </Button>
        </Link>
        <Link href="/signup" className="block w-full" onClick={onLinkClick}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all text-sm">
            Start Interview
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
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
  );
};

export default AuthButtons;
