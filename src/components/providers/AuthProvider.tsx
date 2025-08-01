'use client';

import { useEffect } from 'react';
import { checkAuth } from '@/store/auth/authThunks';
import { useAppDispatch } from '@/store';
import { useRouter } from 'next/navigation';
interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check current auth state via API route
        const response = await dispatch(checkAuth()).unwrap();
        if (!response) {
          const currentPath = window.location.pathname;
          console.log('Current path:', currentPath);
          if (currentPath.startsWith('/dashboard')) {
            router.push('/signin');
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      }
    };

    // Initialize auth when the app starts
    initializeAuth();
  }, [dispatch]);

  return <>{children}</>;
}
