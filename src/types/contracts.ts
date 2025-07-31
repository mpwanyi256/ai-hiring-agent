// Types for the Contract Management System

// Contract Status enum
export type ContractStatus = 'draft' | 'active' | 'archived' | 'deprecated' | 'all';

// Contract Category enum
export type ContractCategory =
  | 'general'
  | 'technical'
  | 'executive'
  | 'intern'
  | 'freelance'
  | 'custom';

export interface Contract {
  id: string;
  companyId: string;
  jobTitleId?: string;
  title: string;
  body: string;
  employmentTypeId?: string;
  contractDuration?: string;
  status: ContractStatus;
  category: ContractCategory;
  isFavorite: boolean;
  tags: string[];
  usageCount: number;
  lastUsedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  jobTitle?: {
    id: string;
    name: string;
  };
  employmentType?: {
    id: string;
    name: string;
  };
  createdByProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ContractOffer {
  id: string;
  contractId: string;
  candidateId: string;
  status: 'sent' | 'signed' | 'rejected';
  signedCopyUrl?: string;
  sentBy: string;
  sentAt: string;
  signedAt?: string;
  rejectedAt?: string;
  signingToken: string;
  expiresAt: string;
  salaryAmount?: number;
  salaryCurrency: string;
  startDate?: string;
  endDate?: string;
  additionalTerms?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  contract?: Contract;
  candidate?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    job?: {
      id: string;
      title: string;
      profile?: {
        company_id: string;
        company?: {
          id: string;
          name: string;
          slug: string;
        };
      };
    };
  };
  sentByProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Employment {
  id: string;
  profileId: string;
  candidateId: string; // Links to the candidate who was hired
  contractOfferId: string;
  employeeId?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  departmentId?: string;
  employmentTypeId?: string;
  workplaceType?: string;
  jobType?: string;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  profile?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string; // This uses the existing UserRole from the system
    company?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  candidate?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    job?: {
      id: string;
      title: string;
      company?: {
        id: string;
        name: string;
        slug: string;
      };
    };
  };
  contractOffer?: ContractOffer;
  department?: {
    id: string;
    name: string;
  };
  employmentType?: {
    id: string;
    name: string;
  };
}

// Job Title and Employment Type interfaces
export interface JobTitle {
  id: string;
  name: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmploymentType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface CreateContractData {
  title: string;
  body: string;
  jobTitleId?: string;
  employmentTypeId?: string;
  contractDuration?: string;
  status?: ContractStatus;
  category?: ContractCategory;
  tags?: string[];
}

export interface UpdateContractData extends CreateContractData {
  id: string;
  isFavorite?: boolean;
}

export interface BulkUpdateContractData {
  contractIds: string[];
  updates: {
    status?: ContractStatus;
    category?: ContractCategory;
    tags?: string[];
    isFavorite?: boolean;
  };
}

export interface SendContractData {
  candidateId: string;
  salaryAmount?: number;
  salaryCurrency?: string;
  startDate?: string;
  endDate?: string;
  additionalTerms?: Record<string, string | number | boolean>;
}

export interface BulkSendContractData {
  contractId: string;
  candidates: {
    candidateId: string;
    salaryAmount?: number;
    salaryCurrency?: string;
    startDate?: string;
    endDate?: string;
    additionalTerms?: Record<string, string | number | boolean>;
  }[];
}

export interface SignContractData {
  action: 'sign' | 'reject';
  signingToken: string;
  rejectionReason?: string;
}

export interface CreateEmploymentData {
  contractOfferId: string;
  profileId: string;
  candidateId: string; // Links to the candidate who was hired
  employeeId?: string;
  departmentId?: string;
  employmentTypeId?: string;
  workplaceType?: string;
  jobType?: string;
}

export interface UpdateEmploymentData {
  id: string;
  employeeId?: string;
  endDate?: string;
  isActive?: boolean;
  departmentId?: string;
  employmentTypeId?: string;
  workplaceType?: string;
  jobType?: string;
}

// AI Generation Types
export interface AIGenerateContractData {
  title?: string;
  jobTitleId?: string;
  employmentTypeId?: string;
  contractDuration?: string;
  userPrompt: string;
  companyId: string;
  companyName: string;
  companyIndustry?: string;
  selectedJobTitle?: string;
  selectedEmploymentType?: string;
}

export interface AIGenerateContractResponse {
  success: boolean;
  contractContent?: string;
  context?: {
    companyName: string;
    companyIndustry: string;
    contractTitle: string;
    jobTitle: string;
    employmentType: string;
    contractDuration: string;
    userRequirements: string;
  };
  improvements?: string[];
  placeholdersAdded?: string[];
  tokensUsed?: number;
  originalLength?: number;
  enhancedLength?: number;
  error?: string;
}

// Job Title Creation
export interface CreateJobTitleData {
  name: string;
}

export interface CreateJobTitleResponse {
  success: boolean;
  jobTitle?: JobTitle;
  error?: string;
}

// Filters and Pagination
export interface ContractsFilters {
  search?: string;
  status?: ContractStatus;
  category?: ContractCategory;
  jobTitleId?: string;
  employmentTypeId?: string;
  createdBy?: string;
  isFavorite?: boolean;
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ContractOffersFilters {
  status?: 'sent' | 'signed' | 'rejected';
  candidateId?: string;
  contractId?: string;
  sentBy?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: 'sentAt' | 'signedAt' | 'rejectedAt';
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
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Analytics Types
export interface ContractAnalytics {
  totalContracts: number;
  contractsByStatus: Record<ContractStatus, number>;
  contractsByCategory: Record<ContractCategory, number>;
  mostUsedContracts: {
    id: string;
    title: string;
    usageCount: number;
  }[];
  recentActivity: {
    contractsCreated: number;
    contractsSent: number;
    contractsSigned: number;
    contractsRejected: number;
  };
  conversionRate: number;
  averageSigningTime: number; // in hours
  popularJobTitles: {
    id: string;
    name: string;
    contractCount: number;
  }[];
  popularEmploymentTypes: {
    id: string;
    name: string;
    contractCount: number;
  }[];
}

// API Response Types
export interface ContractsListResponse {
  success: boolean;
  contracts: Contract[];
  pagination: PaginationInfo;
  analytics?: ContractAnalytics;
}

export interface ContractResponse {
  success: boolean;
  contract: Contract;
}

export interface ContractOffersListResponse {
  success: boolean;
  contractOffers: ContractOffer[];
  pagination: PaginationInfo;
}

export interface ContractOfferResponse {
  success: boolean;
  contractOffer: ContractOffer;
}

export interface EmploymentListResponse {
  success: boolean;
  employment: Employment[];
  pagination: PaginationInfo;
}

export interface EmploymentResponse {
  success: boolean;
  employment: Employment;
}

export interface ContractAnalyticsResponse {
  success: boolean;
  analytics: ContractAnalytics;
}

export interface BulkOperationResponse {
  success: boolean;
  affected: number;
  errors?: string[];
}

// Redux State Types
export interface ContractsState {
  // Contract templates
  contracts: Contract[];
  currentContract: Contract | null;
  selectedContracts: string[];
  contractsLoading: boolean;
  contractsError: string | null;

  // Contract offers
  contractOffers: ContractOffer[];
  currentContractOffer: ContractOffer | null;
  contractOffersLoading: boolean;
  contractOffersError: string | null;

  // Employment records
  employment: Employment[];
  currentEmployment: Employment | null;
  employmentLoading: boolean;
  employmentError: string | null;

  // Analytics
  analytics: ContractAnalytics | null;
  analyticsLoading: boolean;
  analyticsError: string | null;

  // UI state
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSending: boolean;
  isSigning: boolean;
  isGeneratingAI: boolean;
  isBulkOperating: boolean;

  // Pagination
  contractsPagination: PaginationInfo;
  contractOffersPagination: PaginationInfo;
  employmentPagination: PaginationInfo;
}

// Email Template Types
export interface ContractEmailTemplate {
  subject: string;
  body: string;
  variables: Record<string, string>;
}

// Placeholder Variables
export interface ContractPlaceholder {
  key: string;
  label: string;
  description: string;
  example: string;
}

// PDF Extraction Types
export interface ExtractPDFContractData {
  file: File;
  useAiEnhancement: boolean;
}

export interface ExtractPDFContractResponse {
  success: boolean;
  content: string;
  enhanced: boolean;
  filename: string;
  size: number;
  metadata?: {
    pages?: number;
    wordCount: number;
    fileType: string;
  };
}

// AI Enhancement Types
export interface AIEnhanceContractData {
  content: string;
}

export interface AIEnhanceContractResponse {
  success: boolean;
  enhancedContent: string;
  improvements: string[];
  placeholdersAdded: string[];
  originalLength: number;
  enhancedLength: number;
}
