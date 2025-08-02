// Base contract and contract offer types
export interface Contract {
  id: string;
  title: string;
  content: string;
  category: string;
  status: 'draft' | 'active' | 'archived';
  tags: string[];
  jobTitleId?: string;
  employmentTypeId?: string;
  companyId: string;
  createdBy: string;
  isFavorite: boolean;
  contractDuration?: string;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
  // Optional fields for detailed views
  jobTitle?: {
    id: string;
    name: string;
  };
  employmentType?: {
    id: string;
    name: string;
  };
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ContractOffer {
  id: string;
  candidateId: string;
  contractId: string;
  status: 'sent' | 'viewed' | 'signed' | 'rejected' | 'expired';
  salaryAmount: number;
  salaryCurrency: string;
  startDate: string;
  endDate?: string;
  expiresAt: string;
  sentAt: string;
  signedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  signingToken: string;
  additionalTerms?: any;
  signedCopyUrl?: string;
  // Nested objects from API response
  contract: {
    id: string;
    title: string;
  };
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    status: string;
    jobId: string;
  };
  sentByProfile: {
    firstName: string;
    lastName: string;
    email: string;
  };
  company: {
    name: string;
    slug: string;
    logoUrl?: string;
  };
  job: {
    title: string;
    workplaceType: string;
    jobType: string;
    departmentName: string;
    jobTitleName: string;
    employmentTypeName: string;
  };
}

export interface Employment {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional properties for analytics and filtering
  employmentType?: {
    id: string;
    name: string;
  };
  jobType?: string;
  workplaceType?: string;
}

// Filter types
export interface ContractsFilters {
  search?: string;
  status?: string;
  category?: string;
  jobTitleId?: string;
  employmentTypeId?: string;
  createdBy?: string;
  isFavorite?: boolean;
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ContractOffersFilters {
  search?: string;
  status?: string;
  candidateId?: string;
  contractId?: string;
  jobId?: string;
  sentBy?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface EmploymentFilters {
  search?: string;
  isActive?: boolean;
  departmentId?: string;
  employmentTypeId?: string;
  jobType?: string;
  workplaceType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Response types
export interface ContractsListResponse {
  contracts: Contract[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContractOffersListResponse {
  contractOffers: ContractOffer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EmploymentListResponse {
  employment: Employment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContractAnalyticsResponse {
  totalContracts: number;
  activeContracts: number;
  draftContracts: number;
  archivedContracts: number;
  favoriteContracts: number;
  contractsByCategory: Array<{
    category: string;
    count: number;
  }>;
  contractsByJobTitle: Array<{
    jobTitle: string;
    count: number;
  }>;
  contractsByEmploymentType: Array<{
    employmentType: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    contractTitle: string;
    timestamp: string;
  }>;
}

// Create/Update data types
export interface CreateContractData {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  jobTitleId?: string;
  employmentTypeId?: string;
  status?: 'draft' | 'active';
}

export interface UpdateContractData {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  jobTitleId?: string;
  employmentTypeId?: string;
  status?: 'draft' | 'active' | 'archived';
  isFavorite?: boolean;
}

export interface SendContractData {
  candidateId: string;
  salaryAmount: number;
  salaryCurrency: string;
  startDate: string;
  endDate?: string;
  expiresAt: string;
  additionalTerms?: any;
  ccEmails?: string[];
  message?: string;
}

export interface SignContractData {
  signature: {
    type: 'typed' | 'drawn';
    data: string;
    fullName: string;
    timestamp: string;
  };
  additionalTerms?: any;
}

export interface CreateEmploymentData {
  name: string;
  description?: string;
  contractOfferId?: string;
  profileId?: string;
  candidateId?: string;
}

export interface UpdateEmploymentData {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Bulk operation types
export interface BulkUpdateContractData {
  contractIds: string[];
  updates: Partial<UpdateContractData>;
}

export interface BulkSendContractData {
  contractId: string;
  candidates: Array<{
    candidateId: string;
    salaryAmount: number;
    salaryCurrency: string;
    startDate: string;
    endDate?: string;
    expiresAt: string;
    additionalTerms?: any;
  }>;
  ccEmails?: string[];
  message?: string;
}

export interface BulkOperationResponse {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: string[];
}

// AI-related types
export interface ExtractPDFContractData {
  file: File;
  enhanceWithAI?: boolean;
  useAiEnhancement?: boolean;
  jobTitle?: string;
  employmentType?: string;
  category?: string;
}

export interface ExtractPDFContractResponse {
  success: boolean;
  content: string;
  enhancedContent?: string;
  improvements?: string[];
  placeholdersAdded?: number;
  originalLength?: number;
  enhancedLength?: number;
}

export interface AIEnhanceContractData {
  content: string;
  jobTitle?: string;
  employmentType?: string;
  category?: string;
}

export interface AIEnhanceContractResponse {
  success: boolean;
  enhancedContent: string;
  improvements: string[];
  placeholdersAdded: number;
  originalLength: number;
  enhancedLength: number;
}

export interface AIGenerateContractData {
  jobTitle: string;
  employmentType: string;
  category: string;
  additionalRequirements?: string;
}

export interface AIGenerateContractResponse {
  success: boolean;
  content: string;
  title: string;
  category: string;
  tags: string[];
}

// Job title creation
export interface CreateJobTitleData {
  name: string;
  description?: string;
}

export interface CreateJobTitleResponse {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdAt: string;
}

// Redux state type
export interface ContractsState {
  // Contract templates
  contracts: Contract[];
  currentContract: Contract | null;
  contractsLoading: boolean;
  contractsError: string | null;
  contractsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };

  // Contract offers
  contractOffers: ContractOffer[];
  currentContractOffer: ContractOffer | null;
  contractOffersLoading: boolean;
  contractOffersError: string | null;
  contractOffersPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };

  // Employment types
  employment: Employment[];
  currentEmployment: Employment | null;
  employmentLoading: boolean;
  employmentError: string | null;
  employmentPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };

  // Analytics
  analytics: ContractAnalyticsResponse | null;
  analyticsLoading: boolean;
  analyticsError: string | null;

  // UI state
  filters: {
    contracts: ContractsFilters;
    contractOffers: ContractOffersFilters;
    employment: EmploymentFilters;
  };

  // Selection state
  selectedContracts: string[];

  // Operation states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isBulkOperating: boolean;
  isSending: boolean;
  isSigning: boolean;
  isGeneratingAI: boolean;

  // Legacy bulk operations (keeping for compatibility)
  bulkOperationLoading: boolean;
  bulkOperationError: string | null;

  // AI operations
  aiOperationLoading: boolean;
  aiOperationError: string | null;
}

// Utility types
export type ContractStatus = 'draft' | 'active' | 'archived';
export type ContractCategory = string;
export type EmploymentType = string;

// Job Title interface
export interface JobTitle {
  id: string;
  name: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination interface
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Contract Analytics interface
export interface ContractAnalytics {
  totalContracts: number;
  activeContracts: number;
  draftContracts: number;
  archivedContracts: number;
  contractsThisMonth: number;
  contractsLastMonth: number;
  monthlyGrowth: number;
  mostUsed: number;
  categoryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
}

// Response types
export interface ContractResponse {
  success: boolean;
  contract?: Contract;
  error?: string;
}

export interface ContractOfferResponse {
  success: boolean;
  contractOffer?: ContractOffer;
  error?: string;
}

export interface EmploymentResponse {
  success: boolean;
  employment?: Employment;
  error?: string;
}

export interface ContractAnalyticsResponse {
  success: boolean;
  analytics?: ContractAnalytics;
  error?: string;
}

export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
}

// Email and Placeholder types
export interface ContractEmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'offer' | 'signed' | 'rejected' | 'reminder';
}

export interface ContractPlaceholder {
  key: string;
  label: string;
  description: string;
  category: 'candidate' | 'company' | 'contract' | 'date';
  example: string;
}
export type ContractOfferStatus = 'sent' | 'viewed' | 'signed' | 'rejected' | 'expired';
export type SignatureType = 'typed' | 'drawn';

// API error type
export interface ContractAPIError {
  message: string;
  code?: string;
  details?: any;
}
