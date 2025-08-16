'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getClientAnalytics, track } from '@/lib/firebase/client';
import { isDev } from '@/lib/constants';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize once on mount
  useEffect(() => {
    if (!isDev) getClientAnalytics();
  }, []);

  // Log a GA4 page_view whenever the route changes
  useEffect(() => {
    if (typeof window === 'undefined' || isDev) return;

    const page_path = pathname || '/';
    const query = searchParams?.toString();
    const page_location = `${window.location.origin}${page_path}${query ? `?${query}` : ''}`;

    track('page_view', {
      page_location,
      page_path,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
