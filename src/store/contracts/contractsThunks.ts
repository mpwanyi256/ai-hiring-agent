import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  Contract,
  ContractOffer,
  Employment,
  CreateContractData,
  UpdateContractData,
  SendContractData,
  SignContractData,
  CreateEmploymentData,
  UpdateEmploymentData,
  ContractsFilters,
  ContractOffersFilters,
  EmploymentFilters,
  ContractsListResponse,
  BulkUpdateContractData,
  BulkOperationResponse,
  BulkSendContractData,
  ExtractPDFContractData,
  ExtractPDFContractResponse,
  AIEnhanceContractData,
  AIEnhanceContractResponse,
  AIGenerateContractData,
  AIGenerateContractResponse,
  ContractOffersListResponse,
  CreateJobTitleData,
  CreateJobTitleResponse,
  EmploymentListResponse,
  ContractCategoryEntity,
  ContractAnalyticsData,
  ContractOfferSigning,
  FetchSigningOfferParams,
  SignByCandidatePayload,
  RejectByCandidatePayload,
} from '@/types/contracts';
import { apiUtils } from '../api';
import { RootState } from '@/store';
import { ApiResponse } from '@/types';
import { fetchSelectedCandidateContractOffers } from '../selectedCandidate/selectedCandidateThunks';

// Contract Templates
export const fetchContracts = createAsyncThunk<ContractsListResponse, ContractsFilters | undefined>(
  'contracts/fetchContracts',
  async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.jobTitleId) params.append('jobTitleId', filters.jobTitleId);
    if (filters.createdBy) params.append('createdBy', filters.createdBy);
    if (filters.isFavorite !== undefined)
      params.append('isFavorite', filters.isFavorite.toString());
    if (filters.dateRange?.from) params.append('dateFrom', filters.dateRange.from);
    if (filters.dateRange?.to) params.append('dateTo', filters.dateRange.to);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/contracts?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch contracts');
    }

    return response.json();
  },
);

export const fetchContractById = createAsyncThunk<Contract, string>(
  'contracts/fetchContractById',
  async (contractId) => {
    const response = await fetch(`/api/contracts/${contractId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch contract');
    }

    const data = await response.json();
    return data.contract;
  },
);

export const createContract = createAsyncThunk<Contract, CreateContractData>(
  'contracts/createContract',
  async (contractData) => {
    const response = await fetch('/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contractData),
    });

    if (!response.ok) {
      throw new Error('Failed to create contract');
    }

    const data = await response.json();
    return data.contract;
  },
);

export const updateContract = createAsyncThunk<Contract, UpdateContractData>(
  'contracts/updateContract',
  async (updateData) => {
    const { id, ...contractData } = updateData;
    const response = await fetch(`/api/contracts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contractData),
    });

    if (!response.ok) {
      throw new Error('Failed to update contract');
    }

    const data = await response.json();
    return data.contract;
  },
);

export const deleteContract = createAsyncThunk<string, string>(
  'contracts/deleteContract',
  async (contractId) => {
    const response = await fetch(`/api/contracts/${contractId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete contract');
    }

    return contractId;
  },
);

export const toggleContractFavorite = createAsyncThunk<
  Contract,
  { id: string; isFavorite: boolean }
>('contracts/toggleContractFavorite', async ({ id, isFavorite }) => {
  const response = await fetch(`/api/contracts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isFavorite }),
  });

  if (!response.ok) {
    throw new Error('Failed to update contract favorite status');
  }

  const data = await response.json();
  return data.contract;
});

// Bulk Operations
export const bulkUpdateContracts = createAsyncThunk<BulkOperationResponse, BulkUpdateContractData>(
  'contracts/bulkUpdateContracts',
  async (bulkData) => {
    const response = await fetch('/api/contracts/bulk-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bulkData),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk update contracts');
    }

    return response.json();
  },
);

export const bulkDeleteContracts = createAsyncThunk<BulkOperationResponse, string[]>(
  'contracts/bulkDeleteContracts',
  async (contractIds) => {
    const response = await fetch('/api/contracts/bulk-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contractIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk delete contracts');
    }

    return response.json();
  },
);

export const bulkSendContracts = createAsyncThunk<BulkOperationResponse, BulkSendContractData>(
  'contracts/bulkSendContracts',
  async (bulkSendData) => {
    const response = await fetch('/api/contracts/bulk-send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bulkSendData),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk send contracts');
    }

    return response.json();
  },
);

// Analytics
export const fetchContractAnalytics = createAsyncThunk<
  ContractAnalyticsData | null,
  void,
  {
    state: RootState;
    rejectWithValue: (error: string) => void;
  }
>('contracts/fetchContractAnalytics', async (_, { getState, rejectWithValue }) => {
  const state = getState() as RootState;
  const companyId = state.auth.user?.companyId;

  if (!companyId) {
    return rejectWithValue('Company ID is required.');
  }

  const response = await apiUtils.get<ApiResponse<ContractAnalyticsData>>(
    '/api/contracts/analytics',
    {
      params: {
        companyId,
      },
    },
  );

  if (response.error) {
    return rejectWithValue(response.error);
  }

  return response.data || null;
});

// AI Contract Generation
export const generateContractWithAI = createAsyncThunk<
  AIGenerateContractResponse,
  AIGenerateContractData
>('contracts/generateContractWithAI', async (aiData) => {
  const response = await fetch('/api/contracts/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(aiData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate contract with AI');
  }

  return response.json();
});

// Job Title Management
export const createJobTitle = createAsyncThunk<CreateJobTitleResponse, CreateJobTitleData>(
  'contracts/createJobTitle',
  async (jobTitleData) => {
    const response = await fetch('/api/job-titles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobTitleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create job title');
    }

    return response.json();
  },
);

// Contract Categories
export const fetchContractCategories = createAsyncThunk<ContractCategoryEntity[]>(
  'contracts/fetchContractCategories',
  async () => {
    const res = await fetch('/api/contracts/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return data.categories as ContractCategoryEntity[];
  },
);

export const createContractCategory = createAsyncThunk<ContractCategoryEntity, { name: string }>(
  'contracts/createContractCategory',
  async ({ name }) => {
    const res = await fetch('/api/contracts/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create category');
    }
    return (await res.json()).category as ContractCategoryEntity;
  },
);

// Contract Offers
export const sendContract = createAsyncThunk<
  ContractOffer,
  { contractId: string; sendData: SendContractData }
>('contracts/sendContract', async ({ contractId, sendData }) => {
  const response = await fetch(`/api/contracts/${contractId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sendData),
  });

  if (!response.ok) {
    throw new Error('Failed to send contract');
  }

  const data = await response.json();
  return data.contractOffer;
});

export const fetchContractOffers = createAsyncThunk<
  ContractOffersListResponse,
  ContractOffersFilters | undefined
>('contracts/fetchContractOffers', async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.candidateId) params.append('candidateId', filters.candidateId);
  if (filters.contractId) params.append('contractId', filters.contractId);
  if (filters.sentBy) params.append('sentBy', filters.sentBy);
  if (filters.dateRange?.from) params.append('dateFrom', filters.dateRange.from);
  if (filters.dateRange?.to) params.append('dateTo', filters.dateRange.to);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`/api/contract-offers?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch contract offers');
  }

  return response.json();
});

export const fetchContractOfferById = createAsyncThunk<ContractOffer, string>(
  'contracts/fetchContractOfferById',
  async (offerId) => {
    const response = await fetch(`/api/contract-offers/${offerId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch contract offer');
    }

    const data = await response.json();
    return data.contractOffer;
  },
);

export const signContract = createAsyncThunk<
  ContractOffer,
  { offerId: string; signData: SignContractData }
>('contracts/signContract', async ({ offerId, signData }) => {
  const response = await fetch(`/api/contract-offers/${offerId}/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signData),
  });

  if (!response.ok) {
    throw new Error('Failed to sign contract');
  }

  const data = await response.json();
  return data.contractOffer;
});

export const resendContractOffer = createAsyncThunk<ContractOffer, string>(
  'contracts/resendContractOffer',
  async (offerId) => {
    const response = await fetch(`/api/contract-offers/${offerId}/resend`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to resend contract offer');
    }

    const data = await response.json();
    return data.contractOffer;
  },
);

export const downloadSignedContract = createAsyncThunk<string, string>(
  'contracts/downloadSignedContract',
  async (offerId) => {
    const response = await fetch(`/api/contract-offers/${offerId}/download`);

    if (!response.ok) {
      throw new Error('Failed to download signed contract');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    return url;
  },
);

// Employment Records
export const fetchEmployment = createAsyncThunk<
  EmploymentListResponse,
  EmploymentFilters | undefined
>('contracts/fetchEmployment', async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  if (filters.departmentId) params.append('departmentId', filters.departmentId);
  if (filters.employmentTypeId) params.append('employmentTypeId', filters.employmentTypeId);
  if (filters.jobType) params.append('jobType', filters.jobType);
  if (filters.workplaceType) params.append('workplaceType', filters.workplaceType);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`/api/employment?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch employment records');
  }

  return response.json();
});

export const fetchEmploymentById = createAsyncThunk<Employment, string>(
  'contracts/fetchEmploymentById',
  async (employmentId) => {
    const response = await fetch(`/api/employment/${employmentId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch employment record');
    }

    const data = await response.json();
    return data.employment;
  },
);

export const createEmployment = createAsyncThunk<Employment, CreateEmploymentData>(
  'contracts/createEmployment',
  async (employmentData) => {
    const response = await fetch('/api/employment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employmentData),
    });

    if (!response.ok) {
      throw new Error('Failed to create employment record');
    }

    const data = await response.json();
    return data.employment;
  },
);

export const updateEmployment = createAsyncThunk<Employment, UpdateEmploymentData>(
  'contracts/updateEmployment',
  async (updateData) => {
    const { id, ...employmentData } = updateData;
    const response = await fetch(`/api/employment/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employmentData),
    });

    if (!response.ok) {
      throw new Error('Failed to update employment record');
    }

    const data = await response.json();
    return data.employment;
  },
);

// PDF Extraction and AI Enhancement
export const extractPDFContract = createAsyncThunk<
  ExtractPDFContractResponse,
  ExtractPDFContractData
>('contracts/extractPDFContract', async ({ file, useAiEnhancement }) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('useAiEnhancement', (useAiEnhancement || false).toString());

  const response = await fetch('/api/contracts/extract-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to extract content from PDF');
  }

  const data = await response.json();
  return data;
});

export const enhanceContractWithAI = createAsyncThunk<
  AIEnhanceContractResponse,
  AIEnhanceContractData
>('contracts/enhanceContractWithAI', async ({ content }) => {
  const response = await fetch('/api/contracts/ai-enhance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to enhance contract with AI');
  }

  const data = await response.json();
  return data;
});

// Send Contract Offer
export const sendContractOffer = createAsyncThunk<
  { success: boolean; contractOffer: ContractOffer; message: string },
  {
    contractId: string;
    candidateId: string;
    salaryAmount: number;
    salaryCurrency: string;
    startDate?: string;
    endDate?: string;
    customMessage?: string;
    ccEmails?: string[];
  }
>('contracts/sendContractOffer', async (contractData, { getState, rejectWithValue, dispatch }) => {
  const state = getState() as {
    auth: {
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        companyId: string;
        companyName: string;
      } | null;
    };
  };
  const user = state.auth.user;

  if (!user) {
    return rejectWithValue('User not authenticated');
  }

  // Extract only the required user fields
  const userInfo = {
    id: user?.id,
    email: user?.email,
    firstName: user?.firstName,
    lastName: user?.lastName,
    companyId: user?.companyId,
    companyName: user?.companyName,
  };

  const response = await fetch(`/api/contracts/${contractData.contractId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...contractData,
      userInfo, // Pass only required user fields
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send contract');
  }

  const data = await response.json();
  dispatch(fetchSelectedCandidateContractOffers());
  return data;
});

// Cancel Contract Offer
export const cancelContractOffer = createAsyncThunk<
  { success: boolean; message: string; contractOffer: ContractOffer },
  string
>('contracts/cancelContractOffer', async (contractOfferId) => {
  const response = await fetch(`/api/contracts/${contractOfferId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to cancel contract offer');
  }

  const data = await response.json();
  return data;
});

export const fetchSigningOffer = createAsyncThunk<ContractOfferSigning, FetchSigningOfferParams>(
  'contracts/fetchSigningOffer',
  async ({ offerId, token }) => {
    const response = await apiUtils.get<ApiResponse<ContractOfferSigning>>(
      `/api/contract-offers/${offerId}`,
      {
        params: {
          token,
        },
      },
    );
    if (response.error) {
      throw new Error(response.error);
    }
    console.log('Returned contract offer', response.data);
    return response.data;
  },
);

export const signByCandidate = createAsyncThunk<ContractOfferSigning, SignByCandidatePayload>(
  'contracts/signByCandidate',
  async ({ offerId, token, signature }, { dispatch }) => {
    const response = await fetch(`/api/contract-offers/${offerId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, signature }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || 'Failed to sign contract');
    }
    const data = await response.json();

    dispatch(fetchSigningOffer({ offerId, token }));

    return (data.contractOffer || data.contract_offer || data) as ContractOfferSigning;
  },
);

export const rejectByCandidate = createAsyncThunk<ContractOfferSigning, RejectByCandidatePayload>(
  'contracts/rejectByCandidate',
  async ({ offerId, token, rejectionReason }, { dispatch }) => {
    const response = await fetch(`/api/contract-offers/${offerId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signingToken: token, rejectionReason }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || 'Failed to reject contract');
    }
    const data = await response.json();
    dispatch(fetchSigningOffer({ offerId, token }));
    return (data.contractOffer || data.contract_offer || data) as ContractOfferSigning;
  },
);
