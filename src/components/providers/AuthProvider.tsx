'use client';

import { useEffect } from 'react';
import { checkAuth } from '@/store/auth/authThunks';
import { useAppDispatch } from '@/store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check current auth state via API route
        await dispatch(checkAuth());
      } catch (error) {
        console.error('Auth initialization failed:', error);
      }
    };

    // Initialize auth when the app starts
    initializeAuth();
  }, [dispatch]);

  // Show loading screen while initializing auth
  //   if (!isInitialized) {
  //     return (
  //       <div className="min-h-screen bg-background flex items-center justify-center">
  //         <div className="text-center">
  //           <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
  //           <p className="text-muted-text">Loading...</p>
  //         </div>
  //       </div>
  //     );
  //   }

  return <>{children}</>;
}
