import { track } from '@/lib/firebase/client';

// Page view tracking
export const trackPageView = (pageName: string, additionalParams?: Record<string, any>) => {
  track('page_view', {
    page_name: pageName,
    page_location: window.location.href,
    page_title: document.title,
    ...additionalParams,
  });
};

// Marketing pages
export const trackHomePage = () => {
  track('home_page', {
    page_category: 'marketing',
    page_type: 'landing',
  });
};

export const trackPricingPage = () => {
  track('pricing_page', {
    page_category: 'marketing',
    page_type: 'pricing',
  });
};

export const trackContactPage = () => {
  track('contact_page', {
    page_category: 'marketing',
    page_type: 'contact',
  });
};

export const trackFAQPage = () => {
  track('faq_page', {
    page_category: 'marketing',
    page_type: 'faq',
  });
};

// Authentication pages
export const trackSignInPage = () => {
  track('signin_page', {
    page_category: 'authentication',
    page_type: 'signin',
  });
};

export const trackSignUpPage = () => {
  track('signup_page', {
    page_category: 'authentication',
    page_type: 'signup',
  });
};

export const trackEmailVerification = () => {
  track('email_verification', {
    page_category: 'authentication',
    page_type: 'verification',
  });
};

// Dashboard and main app
export const trackDashboard = (section?: string) => {
  track('dashboard', {
    page_category: 'application',
    page_type: 'dashboard',
    dashboard_section: section || 'main',
  });
};

export const trackSettingsPage = (section?: string) => {
  track('settings_page', {
    page_category: 'application',
    page_type: 'settings',
    settings_section: section || 'general',
  });
};

// Contract related events
export const trackContractPage = (contractId: string, action: string) => {
  track('contract_interaction', {
    contract_id: contractId,
    action,
    page_category: 'contracts',
    page_type: 'contract_detail',
  });
};

export const trackContractCreation = (contractType: string) => {
  track('contract_created', {
    contract_type: contractType,
    page_category: 'contracts',
    action: 'create',
  });
};

export const trackContractUpdate = (contractId: string, updateType: string) => {
  track('contract_updated', {
    contract_id: contractId,
    update_type: updateType,
    page_category: 'contracts',
    action: 'update',
  });
};

export const trackContractDeletion = (contractId: string, reason?: string) => {
  track('contract_deleted', {
    contract_id: contractId,
    reason,
    page_category: 'contracts',
    action: 'delete',
  });
};

export const trackContractSending = (contractId: string, candidateId: string) => {
  track('contract_sent', {
    contract_id: contractId,
    candidate_id: candidateId,
    page_category: 'contracts',
    action: 'send',
  });
};

export const trackContractSigning = (
  contractId: string,
  candidateId: string,
  status: 'signed' | 'rejected',
) => {
  track('contract_signed', {
    contract_id: contractId,
    candidate_id: candidateId,
    status,
    page_category: 'contracts',
    action: 'sign',
  });
};

export const trackContractTemplateUsage = (templateId: string, usageType: string) => {
  track('contract_template_used', {
    template_id: templateId,
    usage_type: usageType,
    page_category: 'contracts',
    action: 'use_template',
  });
};

// Job related events
export const trackJobCreation = (jobType: string, source: string) => {
  track('job_created', {
    job_type: jobType,
    source,
    page_category: 'jobs',
    action: 'create',
  });
};

export const trackJobPage = (jobId: string, action: string) => {
  track('job_interaction', {
    job_id: jobId,
    action,
    page_category: 'jobs',
    page_type: 'job_detail',
  });
};

export const trackJobApplication = (jobId: string, candidateId: string) => {
  track('job_application', {
    job_id: jobId,
    candidate_id: candidateId,
    page_category: 'jobs',
    action: 'apply',
  });
};

export const trackJobUpdate = (jobId: string, updateType: string) => {
  track('job_updated', {
    job_id: jobId,
    update_type: updateType,
    page_category: 'jobs',
    action: 'update',
  });
};

export const trackJobDeletion = (jobId: string, reason?: string) => {
  track('job_deleted', {
    job_id: jobId,
    reason,
    page_category: 'jobs',
    action: 'delete',
  });
};

// Candidate related events
export const trackCandidatePage = (candidateId: string, action: string) => {
  track('candidate_interaction', {
    candidate_id: candidateId,
    action,
    page_category: 'candidates',
    page_type: 'candidate_detail',
  });
};

export const trackCandidateEvaluation = (candidateId: string, evaluationType: string) => {
  track('candidate_evaluation', {
    candidate_id: candidateId,
    evaluation_type: evaluationType,
    page_category: 'candidates',
    action: 'evaluate',
  });
};

export const trackInterviewScheduled = (candidateId: string, interviewType: string) => {
  track('interview_scheduled', {
    candidate_id: candidateId,
    interview_type: interviewType,
    page_category: 'interviews',
    action: 'schedule',
  });
};

// Interview related events
export const trackInterviewCreation = (
  candidateId: string,
  jobId: string,
  interviewType: string,
) => {
  track('interview_created', {
    candidate_id: candidateId,
    job_id: jobId,
    interview_type: interviewType,
    page_category: 'interviews',
    action: 'create',
  });
};

export const trackInterviewUpdate = (interviewId: string, updateType: string) => {
  track('interview_updated', {
    interview_id: interviewId,
    update_type: updateType,
    page_category: 'interviews',
    action: 'update',
  });
};

export const trackInterviewStatusChange = (
  interviewId: string,
  oldStatus: string,
  newStatus: string,
) => {
  track('interview_status_changed', {
    interview_id: interviewId,
    old_status: oldStatus,
    new_status: newStatus,
    page_category: 'interviews',
    action: 'status_change',
  });
};

export const trackInterviewCompletion = (
  interviewId: string,
  duration: number,
  outcome: string,
) => {
  track('interview_completed', {
    interview_id: interviewId,
    duration_minutes: duration,
    outcome,
    page_category: 'interviews',
    action: 'complete',
  });
};

// Team and collaboration events
export const trackTeamPage = (action: string) => {
  track('team_interaction', {
    action,
    page_category: 'teams',
    page_type: 'team_management',
  });
};

export const trackInviteSent = (inviteType: string) => {
  track('invite_sent', {
    invite_type: inviteType,
    page_category: 'teams',
    action: 'invite',
  });
};

export const trackTeamMemberInvited = (inviteId: string, role: string, source: string) => {
  track('team_member_invited', {
    invite_id: inviteId,
    role,
    source,
    page_category: 'teams',
    action: 'invite_member',
  });
};

export const trackTeamMemberJoined = (memberId: string, role: string) => {
  track('team_member_joined', {
    member_id: memberId,
    role,
    page_category: 'teams',
    action: 'member_joined',
  });
};

export const trackTeamMemberRemoved = (memberId: string, reason: string) => {
  track('team_member_removed', {
    member_id: memberId,
    reason,
    page_category: 'teams',
    action: 'remove_member',
  });
};

export const trackRoleChanged = (memberId: string, oldRole: string, newRole: string) => {
  track('team_role_changed', {
    member_id: memberId,
    old_role: oldRole,
    new_role: newRole,
    page_category: 'teams',
    action: 'change_role',
  });
};

// Integration events
export const trackProviderConnection = (
  provider: string,
  status: 'initiated' | 'success' | 'failed',
) => {
  track('provider_connection', {
    provider,
    status,
    page_category: 'integrations',
    action: 'connect',
  });
};

export const trackProviderDisconnection = (provider: string, reason?: string) => {
  track('provider_disconnected', {
    provider,
    reason,
    page_category: 'integrations',
    action: 'disconnect',
  });
};

// User engagement events
export const trackFeatureUsage = (feature: string, action: string) => {
  track('feature_usage', {
    feature,
    action,
    page_category: 'engagement',
  });
};

export const trackButtonClick = (buttonName: string, page: string) => {
  track('button_click', {
    button_name: buttonName,
    page,
    page_category: 'engagement',
    action: 'click',
  });
};

export const trackModalOpen = (modalName: string, trigger: string) => {
  track('modal_opened', {
    modal_name: modalName,
    trigger,
    page_category: 'engagement',
    action: 'open_modal',
  });
};

export const trackModalClose = (modalName: string, action: string) => {
  track('modal_closed', {
    modal_name: modalName,
    close_action: action,
    page_category: 'engagement',
    action: 'close_modal',
  });
};

// Error tracking
export const trackError = (errorType: string, errorMessage: string, page: string) => {
  track('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    page,
    page_category: 'errors',
  });
};

// Search and filtering events
export const trackSearch = (searchType: string, query: string, resultsCount: number) => {
  track('search_performed', {
    search_type: searchType,
    query,
    results_count: resultsCount,
    page_category: 'engagement',
    action: 'search',
  });
};

export const trackFilterApplied = (filterType: string, filterValue: string) => {
  track('filter_applied', {
    filter_type: filterType,
    filter_value: filterValue,
    page_category: 'engagement',
    action: 'filter',
  });
};

export const trackFilterCleared = (filterType: string) => {
  track('filter_cleared', {
    filter_type: filterType,
    page_category: 'engagement',
    action: 'clear_filter',
  });
};

export const trackSortApplied = (sortBy: string, sortOrder: string) => {
  track('sort_applied', {
    sort_by: sortBy,
    sort_order: sortOrder,
    page_category: 'engagement',
    action: 'sort',
  });
};

// Pagination and navigation events
export const trackPageChange = (pageNumber: number, pageSize: number, context: string) => {
  track('page_changed', {
    page_number: pageNumber,
    page_size: pageSize,
    context,
    page_category: 'engagement',
    action: 'change_page',
  });
};

export const trackLoadMore = (context: string, itemsLoaded: number) => {
  track('load_more', {
    context,
    items_loaded: itemsLoaded,
    page_category: 'engagement',
    action: 'load_more',
  });
};

// Form and input events
export const trackFormStart = (formName: string, context: string) => {
  track('form_started', {
    form_name: formName,
    context,
    page_category: 'engagement',
    action: 'start_form',
  });
};

export const trackFormSubmission = (formName: string, success: boolean, context: string) => {
  track('form_submitted', {
    form_name: formName,
    success,
    context,
    page_category: 'engagement',
    action: 'submit_form',
  });
};

export const trackFormValidation = (
  formName: string,
  fieldName: string,
  validationType: string,
) => {
  track('form_validation', {
    form_name: formName,
    field_name: fieldName,
    validation_type: validationType,
    page_category: 'engagement',
    action: 'validate_field',
  });
};

// File and media events
export const trackFileUpload = (fileType: string, fileSize: number, context: string) => {
  track('file_uploaded', {
    file_type: fileType,
    file_size: fileSize,
    context,
    page_category: 'engagement',
    action: 'upload_file',
  });
};

export const trackFileDownload = (fileType: string, context: string) => {
  track('file_downloaded', {
    file_type: fileType,
    context,
    page_category: 'engagement',
    action: 'download_file',
  });
};

// Performance and timing events
export const trackPageLoadTime = (pageName: string, loadTime: number) => {
  track('page_load_time', {
    page_name: pageName,
    load_time_ms: loadTime,
    page_category: 'performance',
    action: 'measure_load_time',
  });
};

export const trackApiResponseTime = (endpoint: string, responseTime: number, status: number) => {
  track('api_response_time', {
    endpoint,
    response_time_ms: responseTime,
    status_code: status,
    page_category: 'performance',
    action: 'measure_api_time',
  });
};
