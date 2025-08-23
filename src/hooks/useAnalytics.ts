import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import * as tracking from '@/lib/analytics/tracking';

export const useAnalytics = () => {
  const pathname = usePathname();

  // Auto-track page views based on pathname
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Map pathnames to tracking functions
    const pathTrackingMap: Record<string, () => void> = {
      '/': tracking.trackHomePage,
      '/pricing': tracking.trackPricingPage,
      '/contact': tracking.trackContactPage,
      '/faq': tracking.trackFAQPage,
      '/signin': tracking.trackSignInPage,
      '/signup': tracking.trackSignUpPage,
      '/verify-email': tracking.trackEmailVerification,
      '/dashboard': () => tracking.trackDashboard(),
      '/dashboard/settings': () => tracking.trackSettingsPage(),
      '/dashboard/contracts': () =>
        tracking.trackPageView('contracts_page', {
          page_category: 'application',
          page_type: 'contracts',
        }),
      '/dashboard/jobs': () =>
        tracking.trackPageView('jobs_page', { page_category: 'application', page_type: 'jobs' }),
      '/dashboard/teams': () =>
        tracking.trackPageView('teams_page', { page_category: 'application', page_type: 'teams' }),
      '/dashboard/notifications': () =>
        tracking.trackPageView('notifications_page', {
          page_category: 'application',
          page_type: 'notifications',
        }),
      '/admin': () =>
        tracking.trackPageView('admin_page', { page_category: 'application', page_type: 'admin' }),
    };

    // Find matching tracking function
    const trackingFn = pathTrackingMap[pathname];
    if (trackingFn) {
      trackingFn();
    } else if (pathname.startsWith('/dashboard')) {
      // Handle dashboard sub-pages
      const section = pathname.split('/')[2] || 'main';
      tracking.trackDashboard(section);
    } else if (pathname.startsWith('/jobs/')) {
      // Handle job detail pages
      const jobId = pathname.split('/')[2];
      if (jobId) {
        tracking.trackJobPage(jobId, 'view');
      }
    } else if (pathname.startsWith('/contract/')) {
      // Handle contract detail pages
      const contractId = pathname.split('/')[2];
      if (contractId) {
        tracking.trackContractPage(contractId, 'view');
      }
    } else if (pathname.startsWith('/onboard/invite/')) {
      // Handle team invite pages
      tracking.trackPageView('team_invite_page', {
        page_category: 'authentication',
        page_type: 'team_invite',
      });
    }
  }, [pathname]);

  return {
    // Page tracking
    trackPageView: tracking.trackPageView,
    trackHomePage: tracking.trackHomePage,
    trackPricingPage: tracking.trackPricingPage,
    trackContactPage: tracking.trackContactPage,
    trackFAQPage: tracking.trackFAQPage,
    trackSignInPage: tracking.trackSignInPage,
    trackSignUpPage: tracking.trackSignUpPage,
    trackEmailVerification: tracking.trackEmailVerification,
    trackDashboard: tracking.trackDashboard,
    trackSettingsPage: tracking.trackSettingsPage,

    // Contract tracking
    trackContractPage: tracking.trackContractPage,
    trackContractCreation: tracking.trackContractCreation,
    trackContractUpdate: tracking.trackContractUpdate,
    trackContractDeletion: tracking.trackContractDeletion,
    trackContractSending: tracking.trackContractSending,
    trackContractSigning: tracking.trackContractSigning,
    trackContractTemplateUsage: tracking.trackContractTemplateUsage,

    // Job tracking
    trackJobCreation: tracking.trackJobCreation,
    trackJobPage: tracking.trackJobPage,
    trackJobApplication: tracking.trackJobApplication,
    trackJobUpdate: tracking.trackJobUpdate,
    trackJobDeletion: tracking.trackJobDeletion,

    // Candidate tracking
    trackCandidatePage: tracking.trackCandidatePage,
    trackCandidateEvaluation: tracking.trackCandidateEvaluation,
    trackInterviewScheduled: tracking.trackInterviewScheduled,

    // Interview tracking
    trackInterviewCreation: tracking.trackInterviewCreation,
    trackInterviewUpdate: tracking.trackInterviewUpdate,
    trackInterviewStatusChange: tracking.trackInterviewStatusChange,
    trackInterviewCompletion: tracking.trackInterviewCompletion,

    // Team tracking
    trackTeamPage: tracking.trackTeamPage,
    trackInviteSent: tracking.trackInviteSent,
    trackTeamMemberInvited: tracking.trackTeamMemberInvited,
    trackTeamMemberJoined: tracking.trackTeamMemberJoined,
    trackTeamMemberRemoved: tracking.trackTeamMemberRemoved,
    trackRoleChanged: tracking.trackRoleChanged,

    // Integration tracking
    trackProviderConnection: tracking.trackProviderConnection,
    trackProviderDisconnection: tracking.trackProviderDisconnection,

    // Engagement tracking
    trackFeatureUsage: tracking.trackFeatureUsage,
    trackButtonClick: tracking.trackButtonClick,
    trackModalOpen: tracking.trackModalOpen,
    trackModalClose: tracking.trackModalClose,

    // Error tracking
    trackError: tracking.trackError,

    // Search and filter tracking
    trackSearch: tracking.trackSearch,
    trackFilterApplied: tracking.trackFilterApplied,
    trackFilterCleared: tracking.trackFilterCleared,
    trackSortApplied: tracking.trackSortApplied,

    // Pagination and navigation tracking
    trackPageChange: tracking.trackPageChange,
    trackLoadMore: tracking.trackLoadMore,

    // Form tracking
    trackFormStart: tracking.trackFormStart,
    trackFormSubmission: tracking.trackFormSubmission,
    trackFormValidation: tracking.trackFormValidation,

    // File and media tracking
    trackFileUpload: tracking.trackFileUpload,
    trackFileDownload: tracking.trackFileDownload,

    // Performance tracking
    trackPageLoadTime: tracking.trackPageLoadTime,
    trackApiResponseTime: tracking.trackApiResponseTime,
  };
};
