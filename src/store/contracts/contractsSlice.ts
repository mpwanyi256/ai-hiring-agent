import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ContractsState, Contract, ContractOffer, Employment } from '@/types/contracts';
import {
  fetchContracts,
  fetchContractById,
  createContract,
  updateContract,
  deleteContract,
  sendContract,
  fetchContractOffers,
  fetchContractOfferById,
  signContract,
  fetchEmployment,
  createEmployment,
  updateEmployment,
} from './contractsThunks';

const initialState: ContractsState = {
  // Contract templates
  contracts: [],
  currentContract: null,
  contractsLoading: false,
  contractsError: null,

  // Contract offers
  contractOffers: [],
  currentContractOffer: null,
  contractOffersLoading: false,
  contractOffersError: null,

  // Employment records
  employment: [],
  currentEmployment: null,
  employmentLoading: false,
  employmentError: null,

  // UI state
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isSending: false,
  isSigning: false,

  // Pagination
  contractsPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },
  contractOffersPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },
  employmentPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },
};

const contractsSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    // Clear errors
    clearContractsError: (state) => {
      state.contractsError = null;
    },
    clearContractOffersError: (state) => {
      state.contractOffersError = null;
    },
    clearEmploymentError: (state) => {
      state.employmentError = null;
    },

    // Set current items
    setCurrentContract: (state, action: PayloadAction<Contract | null>) => {
      state.currentContract = action.payload;
    },
    setCurrentContractOffer: (state, action: PayloadAction<ContractOffer | null>) => {
      state.currentContractOffer = action.payload;
    },
    setCurrentEmployment: (state, action: PayloadAction<Employment | null>) => {
      state.currentEmployment = action.payload;
    },

    // Clear state
    clearContractsState: (state) => {
      return initialState;
    },

    // Update contract offer status locally (for real-time updates)
    updateContractOfferStatus: (
      state,
      action: PayloadAction<{ id: string; status: string; signedAt?: string; rejectedAt?: string }>,
    ) => {
      const { id, status, signedAt, rejectedAt } = action.payload;
      const offer = state.contractOffers.find((o) => o.id === id);
      if (offer) {
        offer.status = status as any;
        if (signedAt) offer.signedAt = signedAt;
        if (rejectedAt) offer.rejectedAt = rejectedAt;
      }
      if (state.currentContractOffer?.id === id) {
        state.currentContractOffer.status = status as any;
        if (signedAt) state.currentContractOffer.signedAt = signedAt;
        if (rejectedAt) state.currentContractOffer.rejectedAt = rejectedAt;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Contracts
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.contractsLoading = true;
        state.contractsError = null;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.contractsLoading = false;
        state.contracts = action.payload.contracts;
        if (action.payload.pagination) {
          state.contractsPagination = action.payload.pagination;
        }
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.contractsLoading = false;
        state.contractsError = action.error.message || 'Failed to fetch contracts';
      });

    // Fetch Contract by ID
    builder
      .addCase(fetchContractById.pending, (state) => {
        state.contractsLoading = true;
        state.contractsError = null;
      })
      .addCase(fetchContractById.fulfilled, (state, action) => {
        state.contractsLoading = false;
        state.currentContract = action.payload;
      })
      .addCase(fetchContractById.rejected, (state, action) => {
        state.contractsLoading = false;
        state.contractsError = action.error.message || 'Failed to fetch contract';
      });

    // Create Contract
    builder
      .addCase(createContract.pending, (state) => {
        state.isCreating = true;
        state.contractsError = null;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.isCreating = false;
        state.contracts.unshift(action.payload);
        state.currentContract = action.payload;
      })
      .addCase(createContract.rejected, (state, action) => {
        state.isCreating = false;
        state.contractsError = action.error.message || 'Failed to create contract';
      });

    // Update Contract
    builder
      .addCase(updateContract.pending, (state) => {
        state.isUpdating = true;
        state.contractsError = null;
      })
      .addCase(updateContract.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.contracts.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts[index] = action.payload;
        }
        if (state.currentContract?.id === action.payload.id) {
          state.currentContract = action.payload;
        }
      })
      .addCase(updateContract.rejected, (state, action) => {
        state.isUpdating = false;
        state.contractsError = action.error.message || 'Failed to update contract';
      });

    // Delete Contract
    builder
      .addCase(deleteContract.pending, (state) => {
        state.isDeleting = true;
        state.contractsError = null;
      })
      .addCase(deleteContract.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.contracts = state.contracts.filter((c) => c.id !== action.payload);
        if (state.currentContract?.id === action.payload) {
          state.currentContract = null;
        }
      })
      .addCase(deleteContract.rejected, (state, action) => {
        state.isDeleting = false;
        state.contractsError = action.error.message || 'Failed to delete contract';
      });

    // Send Contract
    builder
      .addCase(sendContract.pending, (state) => {
        state.isSending = true;
        state.contractOffersError = null;
      })
      .addCase(sendContract.fulfilled, (state, action) => {
        state.isSending = false;
        state.contractOffers.unshift(action.payload);
        state.currentContractOffer = action.payload;
      })
      .addCase(sendContract.rejected, (state, action) => {
        state.isSending = false;
        state.contractOffersError = action.error.message || 'Failed to send contract';
      });

    // Fetch Contract Offers
    builder
      .addCase(fetchContractOffers.pending, (state) => {
        state.contractOffersLoading = true;
        state.contractOffersError = null;
      })
      .addCase(fetchContractOffers.fulfilled, (state, action) => {
        state.contractOffersLoading = false;
        state.contractOffers = action.payload.contractOffers;
        if (action.payload.pagination) {
          state.contractOffersPagination = action.payload.pagination;
        }
      })
      .addCase(fetchContractOffers.rejected, (state, action) => {
        state.contractOffersLoading = false;
        state.contractOffersError = action.error.message || 'Failed to fetch contract offers';
      });

    // Fetch Contract Offer by ID
    builder
      .addCase(fetchContractOfferById.pending, (state) => {
        state.contractOffersLoading = true;
        state.contractOffersError = null;
      })
      .addCase(fetchContractOfferById.fulfilled, (state, action) => {
        state.contractOffersLoading = false;
        state.currentContractOffer = action.payload;
      })
      .addCase(fetchContractOfferById.rejected, (state, action) => {
        state.contractOffersLoading = false;
        state.contractOffersError = action.error.message || 'Failed to fetch contract offer';
      });

    // Sign Contract
    builder
      .addCase(signContract.pending, (state) => {
        state.isSigning = true;
        state.contractOffersError = null;
      })
      .addCase(signContract.fulfilled, (state, action) => {
        state.isSigning = false;
        const index = state.contractOffers.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.contractOffers[index] = action.payload;
        }
        if (state.currentContractOffer?.id === action.payload.id) {
          state.currentContractOffer = action.payload;
        }
      })
      .addCase(signContract.rejected, (state, action) => {
        state.isSigning = false;
        state.contractOffersError = action.error.message || 'Failed to sign contract';
      });

    // Fetch Employment
    builder
      .addCase(fetchEmployment.pending, (state) => {
        state.employmentLoading = true;
        state.employmentError = null;
      })
      .addCase(fetchEmployment.fulfilled, (state, action) => {
        state.employmentLoading = false;
        state.employment = action.payload.employment;
        if (action.payload.pagination) {
          state.employmentPagination = action.payload.pagination;
        }
      })
      .addCase(fetchEmployment.rejected, (state, action) => {
        state.employmentLoading = false;
        state.employmentError = action.error.message || 'Failed to fetch employment records';
      });

    // Create Employment
    builder
      .addCase(createEmployment.pending, (state) => {
        state.isCreating = true;
        state.employmentError = null;
      })
      .addCase(createEmployment.fulfilled, (state, action) => {
        state.isCreating = false;
        state.employment.unshift(action.payload);
        state.currentEmployment = action.payload;
      })
      .addCase(createEmployment.rejected, (state, action) => {
        state.isCreating = false;
        state.employmentError = action.error.message || 'Failed to create employment record';
      });

    // Update Employment
    builder
      .addCase(updateEmployment.pending, (state) => {
        state.isUpdating = true;
        state.employmentError = null;
      })
      .addCase(updateEmployment.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.employment.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.employment[index] = action.payload;
        }
        if (state.currentEmployment?.id === action.payload.id) {
          state.currentEmployment = action.payload;
        }
      })
      .addCase(updateEmployment.rejected, (state, action) => {
        state.isUpdating = false;
        state.employmentError = action.error.message || 'Failed to update employment record';
      });
  },
});

export const {
  clearContractsError,
  clearContractOffersError,
  clearEmploymentError,
  setCurrentContract,
  setCurrentContractOffer,
  setCurrentEmployment,
  clearContractsState,
  updateContractOfferStatus,
} = contractsSlice.actions;

export default contractsSlice.reducer;
