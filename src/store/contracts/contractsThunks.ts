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
  ContractResponse,
  ContractOffersListResponse,
  ContractOfferResponse,
  EmploymentListResponse,
  EmploymentResponse,
} from '@/types/contracts';

// Contract Templates
export const fetchContracts = createAsyncThunk<ContractsListResponse, ContractsFilters | undefined>(
  'contracts/fetchContracts',
  async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.jobTitleId) params.append('jobTitleId', filters.jobTitleId);
    if (filters.employmentTypeId) params.append('employmentTypeId', filters.employmentTypeId);
    if (filters.createdBy) params.append('createdBy', filters.createdBy);
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
