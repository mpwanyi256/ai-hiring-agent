import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ContractsState, Contract, ContractOffer, Employment } from '@/types/contracts';
import {
  fetchContracts,
  fetchContractById,
  createContract,
  updateContract,
  updateContractStatus,
  deleteContract,
  toggleContractFavorite,
  bulkUpdateContracts,
  bulkDeleteContracts,
  bulkSendContracts,
  fetchContractAnalytics,
  sendContract,
  fetchContractOffers,
  fetchContractOfferById,
  signContract,
  fetchEmployment,
  createEmployment,
  updateEmployment,
  generateContractWithAI,
  createJobTitle,
  cancelContractOffer,
  fetchContractCategories,
  createContractCategory,
  fetchSigningOffer,
  signByCandidate,
  rejectByCandidate,
  refineContractWithAI,
} from './contractsThunks';

const initialState: ContractsState = {
  // Contract templates
  contracts: [],
  currentContract: null,
  contractsLoading: false,
  contractsError: null,
  contractsPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },

  // Contract offers
  contractOffers: [],
  currentContractOffer: null,
  contractOffersLoading: false,
  contractOffersError: null,
  contractOffersPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },

  // Employment types
  employment: [],
  currentEmployment: null,
  employmentLoading: false,
  employmentError: null,
  employmentPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },

  // Analytics
  analytics: null,
  analyticsLoading: false,
  analyticsError: null,

  // Categories
  categories: [],
  categoriesLoading: false,
  categoriesError: null,

  // UI state
  filters: {
    contracts: {},
    contractOffers: {},
    employment: {},
  },

  // Selection state
  selectedContracts: [],

  // Operation states
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isBulkOperating: false,
  isSending: false,
  isSigning: false,
  isGeneratingAI: false,

  // Legacy bulk operations (keeping for compatibility)
  bulkOperationLoading: false,
  bulkOperationError: null,

  // AI operations
  aiOperationLoading: false,
  aiOperationError: null,

  // Candidate signing view
  signingOffer: null,
  signingLoading: false,
  signingError: null,
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
    clearAnalyticsError: (state) => {
      state.analyticsError = null;
    },
    resetSigningOffer: (state) => {
      state.signingOffer = null;
      state.signingLoading = false;
      state.signingError = null;
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

    // Contract selection for bulk operations
    toggleContractSelection: (state, action: PayloadAction<string>) => {
      const contractId = action.payload;
      const index = state.selectedContracts.indexOf(contractId);
      if (index > -1) {
        state.selectedContracts.splice(index, 1);
      } else {
        state.selectedContracts.push(contractId);
      }
    },
    selectAllContracts: (state) => {
      state.selectedContracts = state.contracts.map((contract) => contract.id);
    },
    deselectAllContracts: (state) => {
      state.selectedContracts = [];
    },
    setSelectedContracts: (state, action: PayloadAction<string[]>) => {
      state.selectedContracts = action.payload;
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
        offer.status = status as 'sent' | 'signed' | 'rejected';
        if (signedAt) offer.signedAt = signedAt;
        if (rejectedAt) offer.rejectedAt = rejectedAt;
      }
      if (state.currentContractOffer?.id === id) {
        state.currentContractOffer.status = status as 'sent' | 'signed' | 'rejected';
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
          state.contractsPagination = {
            ...action.payload.pagination,
            hasMore: action.payload.pagination.page < action.payload.pagination.totalPages,
          };
        }
        // Clear selection when fetching new contracts
        state.selectedContracts = [];
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

    // Update Contract Status
    builder
      .addCase(updateContractStatus.pending, (state) => {
        state.isUpdating = true;
        state.contractsError = null;
      })
      .addCase(updateContractStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.contracts.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts[index] = action.payload;
        }
        if (state.currentContract?.id === action.payload.id) {
          state.currentContract = action.payload;
        }
      })
      .addCase(updateContractStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.contractsError = action.error.message || 'Failed to update contract status';
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
        // Remove from selection if it was selected
        state.selectedContracts = state.selectedContracts.filter((id) => id !== action.payload);
      })
      .addCase(deleteContract.rejected, (state, action) => {
        state.isDeleting = false;
        state.contractsError = action.error.message || 'Failed to delete contract';
      });

    // Toggle Contract Favorite
    builder
      .addCase(toggleContractFavorite.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(toggleContractFavorite.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.contracts.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts[index] = action.payload;
        }
        if (state.currentContract?.id === action.payload.id) {
          state.currentContract = action.payload;
        }
      })
      .addCase(toggleContractFavorite.rejected, (state, action) => {
        state.isUpdating = false;
        state.contractsError = action.error.message || 'Failed to update favorite status';
      });

    // Bulk Update Contracts
    builder
      .addCase(bulkUpdateContracts.pending, (state) => {
        state.isBulkOperating = true;
        state.contractsError = null;
      })
      .addCase(bulkUpdateContracts.fulfilled, (state, action) => {
        state.isBulkOperating = false;
        // Clear selection after successful bulk operation
        state.selectedContracts = [];
        // Re-fetch contracts to get updated data
      })
      .addCase(bulkUpdateContracts.rejected, (state, action) => {
        state.isBulkOperating = false;
        state.contractsError = action.error.message || 'Failed to bulk update contracts';
      });

    // Bulk Delete Contracts
    builder
      .addCase(bulkDeleteContracts.pending, (state) => {
        state.isBulkOperating = true;
        state.contractsError = null;
      })
      .addCase(bulkDeleteContracts.fulfilled, (state, action) => {
        state.isBulkOperating = false;
        // Remove deleted contracts from state
        const deletedIds = state.selectedContracts;
        state.contracts = state.contracts.filter((c) => !deletedIds.includes(c.id));
        state.selectedContracts = [];
      })
      .addCase(bulkDeleteContracts.rejected, (state, action) => {
        state.isBulkOperating = false;
        state.contractsError = action.error.message || 'Failed to bulk delete contracts';
      });

    // Bulk Send Contracts
    builder
      .addCase(bulkSendContracts.pending, (state) => {
        state.isBulkOperating = true;
        state.contractOffersError = null;
      })
      .addCase(bulkSendContracts.fulfilled, (state) => {
        state.isBulkOperating = false;
        // Clear selection after successful bulk operation
        state.selectedContracts = [];
      })
      .addCase(bulkSendContracts.rejected, (state, action) => {
        state.isBulkOperating = false;
        state.contractOffersError = action.error.message || 'Failed to bulk send contracts';
      });

    // Fetch Contract Analytics
    builder
      .addCase(fetchContractAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchContractAnalytics.fulfilled, (state, { payload }) => {
        state.analyticsLoading = false;
        state.analytics = payload || null;
      })
      .addCase(fetchContractAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.error.message || 'Failed to fetch analytics';
      });

    // Generate Contract with AI
    builder
      .addCase(generateContractWithAI.pending, (state) => {
        state.isGeneratingAI = true;
        state.contractsError = null;
      })
      .addCase(generateContractWithAI.fulfilled, (state) => {
        state.isGeneratingAI = false;
        // The generated content will be handled by the component directly
      })
      .addCase(generateContractWithAI.rejected, (state, action) => {
        state.isGeneratingAI = false;
        state.contractsError = action.error.message || 'Failed to generate contract with AI';
      });

    // Create Job Title
    builder
      .addCase(createJobTitle.pending, (state) => {
        state.contractsLoading = true;
        state.contractsError = null;
      })
      .addCase(createJobTitle.fulfilled, (state) => {
        state.contractsLoading = false;
        // Job title creation success will be handled by refetching job titles
      })
      .addCase(createJobTitle.rejected, (state, action) => {
        state.contractsLoading = false;
        state.contractsError = action.error.message || 'Failed to create job title';
      });

    // Categories
    builder
      .addCase(fetchContractCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchContractCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchContractCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.error.message || 'Failed to fetch categories';
      })
      .addCase(createContractCategory.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(createContractCategory.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories.unshift(action.payload);
      })
      .addCase(createContractCategory.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.error.message || 'Failed to create category';
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
          state.contractOffersPagination = {
            ...action.payload.pagination,
            hasMore: action.payload.pagination.page < action.payload.pagination.totalPages,
          };
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
          state.employmentPagination = {
            ...action.payload.pagination,
            hasMore: action.payload.pagination.page < action.payload.pagination.totalPages,
          };
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
      })

      // Cancel Contract Offer
      .addCase(cancelContractOffer.pending, (state) => {
        state.contractOffersLoading = true;
        state.contractOffersError = null;
      })
      .addCase(cancelContractOffer.fulfilled, (state, action) => {
        state.contractOffersLoading = false;
        // Update the contract offer status in the state
        const contractOfferId = action.meta.arg;
        const offerIndex = state.contractOffers.findIndex((offer) => offer.id === contractOfferId);
        if (offerIndex !== -1) {
          state.contractOffers[offerIndex].status = 'expired';
        }
        if (state.currentContractOffer?.id === contractOfferId) {
          state.currentContractOffer.status = 'expired';
        }
      })
      .addCase(cancelContractOffer.rejected, (state, action) => {
        state.contractOffersLoading = false;
        state.contractOffersError = action.error.message || 'Failed to cancel contract offer';
      });

    // Candidate signing view
    builder
      .addCase(fetchSigningOffer.pending, (state) => {
        state.signingLoading = true;
        state.signingError = null;
      })
      .addCase(fetchSigningOffer.fulfilled, (state, action) => {
        state.signingLoading = false;
        state.signingOffer = action.payload;
      })
      .addCase(fetchSigningOffer.rejected, (state, action) => {
        state.signingLoading = false;
        state.signingError = action.error.message || 'Failed to load contract offer';
      })
      .addCase(signByCandidate.pending, (state) => {
        state.signingLoading = true;
      })
      .addCase(signByCandidate.fulfilled, (state, action) => {
        state.signingLoading = false;
        state.signingOffer = action.payload;
      })
      .addCase(signByCandidate.rejected, (state, action) => {
        state.signingLoading = false;
        state.signingError = action.error.message || 'Failed to sign contract';
      })
      .addCase(rejectByCandidate.pending, (state) => {
        state.signingLoading = true;
      })
      .addCase(rejectByCandidate.fulfilled, (state, action) => {
        state.signingLoading = false;
        state.signingOffer = action.payload;
      })
      .addCase(rejectByCandidate.rejected, (state, action) => {
        state.signingLoading = false;
        state.signingError = action.error.message || 'Failed to reject contract';
      })

      // Contract Refinement with AI
      .addCase(refineContractWithAI.pending, (state) => {
        state.aiOperationLoading = true;
        state.aiOperationError = null;
      })
      .addCase(refineContractWithAI.fulfilled, (state) => {
        state.aiOperationLoading = false;
      })
      .addCase(refineContractWithAI.rejected, (state, action) => {
        state.aiOperationLoading = false;
        state.aiOperationError = action.error.message || 'Failed to refine contract';
      });
  },
});

export const {
  clearContractsError,
  clearContractOffersError,
  clearEmploymentError,
  clearAnalyticsError,
  setCurrentContract,
  setCurrentContractOffer,
  setCurrentEmployment,
  toggleContractSelection,
  selectAllContracts,
  deselectAllContracts,
  setSelectedContracts,
  clearContractsState,
  updateContractOfferStatus,
  resetSigningOffer,
} = contractsSlice.actions;

export default contractsSlice.reducer;
