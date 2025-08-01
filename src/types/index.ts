// Export all auth types
export * from './auth';

// Export all job types
export * from './jobs';

// Export all candidate types
export * from './candidates';

// Export all billing types
export * from './billing';

// Export all contract types (excluding conflicting EmploymentType)
export type {
  ContractStatus,
  ContractCategory,
  Contract,
  ContractOffer,
  Employment,
  JobTitle,
  CreateContractData,
  UpdateContractData,
  BulkUpdateContractData,
  SendContractData,
  BulkSendContractData,
  SignContractData,
  CreateEmploymentData,
  UpdateEmploymentData,
  AIGenerateContractData,
  AIGenerateContractResponse,
  CreateJobTitleData,
  CreateJobTitleResponse,
  ContractsFilters,
  ContractOffersFilters,
  EmploymentFilters,
  PaginationInfo,
  ContractAnalytics,
  ContractsListResponse,
  ContractResponse,
  ContractOffersListResponse,
  ContractOfferResponse,
  EmploymentListResponse,
  EmploymentResponse,
  ContractAnalyticsResponse,
  BulkOperationResponse,
  ContractsState,
  ContractEmailTemplate,
  ContractPlaceholder,
} from './contracts';

// Re-export EmploymentType from contracts with a different name to avoid conflict
export type { EmploymentType as ContractEmploymentType } from './contracts';

// Export all supabase types
export * from './core';

// Export all admin types
export * from './admin';

// Interview types
export type {
  Interview,
  InterviewStatus,
  CreateInterviewData,
  UpdateInterviewData,
  InterviewFilters,
  InterviewsState,
  InterviewsListResponse,
  InterviewDetailResponse,
  CreateInterviewResponse,
  UpdateInterviewResponse,
  DeleteInterviewResponse,
  GoogleCalendarEvent,
  CreateCalendarEventData,
  TimezoneOption,
  TimeSlot,
  DateAvailability,
  Country,
  Timezone,
} from './interviews';

// Company types
export type { Company, UpdateCompanyData, CompanyState } from './company';

// Export all common types
export * from './common';

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface SupabaseResponse<T> {
  data: T;
  error: {
    code: string;
    message: string;
    hint?: string;
  } | null;
}
