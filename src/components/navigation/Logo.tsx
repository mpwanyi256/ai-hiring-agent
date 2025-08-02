import Link from 'next/link';
import Image from 'next/image';
import { app } from '@/lib/constants';
import { useAppSelector } from '@/store';
import { selectIsAuthenticated } from '@/store/auth/authSelectors';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  console.log('isAuthenticated', isAuthenticated);

  return (
    <Link
      href={isAuthenticated ? '/dashboard' : '/'}
      className={`flex items-center space-x-3 hover-lift ${className}`}
    >
      <Image
        src="/images/logo.png"
        alt="Intervio Logo"
        width={40}
        height={40}
        objectFit="contain"
      />
      <span className="text-xl font-bold text-text">{app.name}</span>
    </Link>
  );
};

export default Logo;
