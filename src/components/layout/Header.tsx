import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/store/slices/authSlice';
import { RootState, AppDispatch } from '@/store';
import { 
  SparklesIcon,
  CogIcon,
  UserIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await dispatch(signOut()).unwrap();
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <header className="border-b border-surface bg-white shadow-sm">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">AI Hiring Agent</span>
            </Link>
            {title && (
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold text-text">{title}</h1>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="hidden md:block">
                    <p className="font-medium text-text text-sm">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-muted-text text-xs">{user?.companyName}</p>
                  </div>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-muted-text" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-light z-50">
                  <div className="p-4 border-b border-gray-light">
                    <p className="font-medium text-text text-sm">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-muted-text text-xs">{user?.email}</p>
                    <p className="text-muted-text text-xs">{user?.companyName}</p>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      <CogIcon className="w-4 h-4 mr-3 text-muted-text" />
                      Settings
                    </Link>
                    
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleSignOut();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-accent-red hover:bg-gray-50"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 