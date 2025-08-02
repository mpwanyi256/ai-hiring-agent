import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';

// Basic selectors
export const selectContractsState = (state: RootState) => state.contracts;

// Contract Templates
export const selectContracts = (state: RootState) => state.contracts.contracts;
export const selectCurrentContract = (state: RootState) => state.contracts.currentContract;
export const selectContractsLoading = (state: RootState) => state.contracts.contractsLoading;
export const selectContractsError = (state: RootState) => state.contracts.contractsError;
export const selectContractsPagination = (state: RootState) => state.contracts.contractsPagination;

// Contract Selection for Bulk Operations
export const selectSelectedContracts = (state: RootState) => state.contracts.selectedContracts;
export const selectIsAnyContractSelected = (state: RootState) =>
  state.contracts.selectedContracts.length > 0;
export const selectSelectedContractsCount = (state: RootState) =>
  state.contracts.selectedContracts.length;
export const selectIsAllContractsSelected = createSelector(
  [selectContracts, selectSelectedContracts],
  (contracts, selected) => contracts.length > 0 && contracts.length === selected.length,
);

// Contract Offers
export const selectContractOffers = (state: RootState) => state.contracts.contractOffers;
export const selectCurrentContractOffer = (state: RootState) =>
  state.contracts.currentContractOffer;
export const selectContractOffersLoading = (state: RootState) =>
  state.contracts.contractOffersLoading;
export const selectContractOffersError = (state: RootState) => state.contracts.contractOffersError;
export const selectContractOffersPagination = (state: RootState) =>
  state.contracts.contractOffersPagination;

// Employment Records
export const selectEmployment = (state: RootState) => state.contracts.employment;
export const selectCurrentEmployment = (state: RootState) => state.contracts.currentEmployment;
export const selectEmploymentLoading = (state: RootState) => state.contracts.employmentLoading;
export const selectEmploymentError = (state: RootState) => state.contracts.employmentError;
export const selectEmploymentPagination = (state: RootState) =>
  state.contracts.employmentPagination;

// Analytics
export const selectContractAnalytics = (state: RootState) => state.contracts.analytics;
export const selectAnalyticsLoading = (state: RootState) => state.contracts.analyticsLoading;
export const selectAnalyticsError = (state: RootState) => state.contracts.analyticsError;

// UI State
export const selectIsCreating = (state: RootState) => state.contracts.isCreating;
export const selectIsUpdating = (state: RootState) => state.contracts.isUpdating;
export const selectIsDeleting = (state: RootState) => state.contracts.isDeleting;
export const selectIsSending = (state: RootState) => state.contracts.isSending;
export const selectIsSigning = (state: RootState) => state.contracts.isSigning;
export const selectIsGeneratingAI = (state: RootState) => state.contracts.isGeneratingAI;
export const selectIsBulkOperating = (state: RootState) => state.contracts.isBulkOperating;

// Derived selectors
export const selectContractById = createSelector(
  [selectContracts, (state: RootState, contractId: string) => contractId],
  (contracts, contractId) => contracts.find((contract) => contract.id === contractId),
);

export const selectContractOfferById = createSelector(
  [selectContractOffers, (state: RootState, offerId: string) => offerId],
  (contractOffers, offerId) => contractOffers.find((offer) => offer.id === offerId),
);

export const selectEmploymentById = createSelector(
  [selectEmployment, (state: RootState, employmentId: string) => employmentId],
  (employment, employmentId) => employment.find((emp) => emp.id === employmentId),
);

// Selected Contracts Details
export const selectSelectedContractsDetails = createSelector(
  [selectContracts, selectSelectedContracts],
  (contracts, selectedIds) => contracts.filter((contract) => selectedIds.includes(contract.id)),
);

// Contract Offers by Status
export const selectPendingContractOffers = createSelector(
  [selectContractOffers],
  (contractOffers) => contractOffers.filter((offer) => offer.status === 'sent'),
);

export const selectSignedContractOffers = createSelector([selectContractOffers], (contractOffers) =>
  contractOffers.filter((offer) => offer.status === 'signed'),
);

export const selectRejectedContractOffers = createSelector(
  [selectContractOffers],
  (contractOffers) => contractOffers.filter((offer) => offer.status === 'rejected'),
);

// Contracts by Status
export const selectContractsByStatus = createSelector([selectContracts], (contracts) => {
  return {
    draft: contracts.filter((c) => c.status === 'draft'),
    active: contracts.filter((c) => c.status === 'active'),
    archived: contracts.filter((c) => c.status === 'archived'),
    deprecated: contracts.filter((c) => c.status === 'deprecated'),
  };
});

// Contracts by Category
export const selectContractsByCategory = createSelector([selectContracts], (contracts) => {
  return {
    general: contracts.filter((c) => c.category === 'general'),
    technical: contracts.filter((c) => c.category === 'technical'),
    executive: contracts.filter((c) => c.category === 'executive'),
    intern: contracts.filter((c) => c.category === 'intern'),
    freelance: contracts.filter((c) => c.category === 'freelance'),
    custom: contracts.filter((c) => c.category === 'custom'),
  };
});

// Favorite Contracts
export const selectFavoriteContracts = createSelector([selectContracts], (contracts) =>
  contracts.filter((contract) => contract.isFavorite),
);

// Most Used Contracts
export const selectMostUsedContracts = createSelector([selectContracts], (contracts) =>
  [...contracts].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10),
);

// Recently Used Contracts
export const selectRecentlyUsedContracts = createSelector([selectContracts], (contracts) =>
  contracts
    .filter((contract) => contract.lastUsedAt)
    .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
    .slice(0, 10),
);

// Employment by Status
export const selectActiveEmployment = createSelector([selectEmployment], (employment) =>
  employment.filter((emp) => emp.isActive),
);

export const selectInactiveEmployment = createSelector([selectEmployment], (employment) =>
  employment.filter((emp) => !emp.isActive),
);

// Contract Templates by Job Title
export const selectContractsByJobTitle = createSelector(
  [selectContracts, (state: RootState, jobTitleId: string) => jobTitleId],
  (contracts, jobTitleId) => contracts.filter((contract) => contract.jobTitleId === jobTitleId),
);

// Contract Templates by Employment Type
export const selectContractsByEmploymentType = createSelector(
  [selectContracts, (state: RootState, employmentTypeId: string) => employmentTypeId],
  (contracts, employmentTypeId) =>
    contracts.filter((contract) => contract.employmentTypeId === employmentTypeId),
);

// Contracts by Tags
export const selectContractsByTag = createSelector(
  [selectContracts, (state: RootState, tag: string) => tag],
  (contracts, tag) => contracts.filter((contract) => contract.tags.includes(tag)),
);

// All Tags from Contracts
export const selectAllContractTags = createSelector([selectContracts], (contracts) => {
  const allTags = contracts.flatMap((contract) => contract.tags);
  const uniqueTags = [...new Set(allTags)];
  return uniqueTags.sort();
});

// Tag Usage Count
export const selectTagUsage = createSelector([selectContracts], (contracts) => {
  const tagCounts: Record<string, number> = {};
  contracts.forEach((contract) => {
    contract.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
});

// Employment for specific candidate
export const selectEmploymentForCandidate = createSelector(
  [selectEmployment, (state: RootState, candidateId: string) => candidateId],
  (employment, candidateId) => employment.find((emp) => emp.candidateId === candidateId),
);

// Employment by Company (via profile relationship)
export const selectEmploymentByCompany = createSelector(
  [selectEmployment, (state: RootState, companyId: string) => companyId],
  (employment, companyId) => employment.filter((emp) => emp.profile?.company?.id === companyId),
);

// Employment by Job (via candidate relationship)
export const selectEmploymentByJob = createSelector(
  [selectEmployment, (state: RootState, jobId: string) => jobId],
  (employment, jobId) => employment.filter((emp) => emp.candidate?.job?.id === jobId),
);

// Employment by Department
export const selectEmploymentByDepartment = createSelector(
  [selectEmployment, (state: RootState, departmentId: string) => departmentId],
  (employment, departmentId) => employment.filter((emp) => emp.departmentId === departmentId),
);

// Enhanced Statistics selectors
export const selectContractsStats = createSelector([selectContracts], (contracts) => ({
  total: contracts.length,
  byStatus: {
    draft: contracts.filter((c) => c.status === 'draft').length,
    active: contracts.filter((c) => c.status === 'active').length,
    archived: contracts.filter((c) => c.status === 'archived').length,
    deprecated: contracts.filter((c) => c.status === 'deprecated').length,
  },
  byCategory: {
    general: contracts.filter((c) => c.category === 'general').length,
    technical: contracts.filter((c) => c.category === 'technical').length,
    executive: contracts.filter((c) => c.category === 'executive').length,
    intern: contracts.filter((c) => c.category === 'intern').length,
    freelance: contracts.filter((c) => c.category === 'freelance').length,
    custom: contracts.filter((c) => c.category === 'custom').length,
  },
  favorites: contracts.filter((c) => c.isFavorite).length,
  totalUsage: contracts.reduce((sum, c) => sum + c.usageCount, 0),
  averageUsage:
    contracts.length > 0
      ? contracts.reduce((sum, c) => sum + c.usageCount, 0) / contracts.length
      : 0,
  byJobTitle: contracts.reduce(
    (acc, contract) => {
      if (contract.jobTitle) {
        acc[contract.jobTitle.name] = (acc[contract.jobTitle.name] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  ),
  byEmploymentType: contracts.reduce(
    (acc, contract) => {
      if (contract.employmentType) {
        acc[contract.employmentType.name] = (acc[contract.employmentType.name] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  ),
}));

export const selectContractOffersStats = createSelector(
  [selectContractOffers],
  (contractOffers) => ({
    total: contractOffers.length,
    pending: contractOffers.filter((offer) => offer.status === 'sent').length,
    signed: contractOffers.filter((offer) => offer.status === 'signed').length,
    rejected: contractOffers.filter((offer) => offer.status === 'rejected').length,
    signRate:
      contractOffers.length > 0
        ? (contractOffers.filter((offer) => offer.status === 'signed').length /
            contractOffers.length) *
          100
        : 0,
    rejectRate:
      contractOffers.length > 0
        ? (contractOffers.filter((offer) => offer.status === 'rejected').length /
            contractOffers.length) *
          100
        : 0,
  }),
);

export const selectEmploymentStats = createSelector([selectEmployment], (employment) => ({
  total: employment.length,
  active: employment.filter((emp) => emp.isActive).length,
  inactive: employment.filter((emp) => !emp.isActive).length,
  byDepartment: employment.reduce(
    (acc, emp) => {
      if (emp.department) {
        acc[emp.department.name] = (acc[emp.department.name] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  ),
  byEmploymentType: employment.reduce(
    (acc, emp) => {
      if (emp.employmentType) {
        acc[emp.employmentType.name] = (acc[emp.employmentType.name] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  ),
  byJobType: employment.reduce(
    (acc, emp) => {
      if (emp.jobType) {
        acc[emp.jobType] = (acc[emp.jobType] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  ),
  byWorkplaceType: employment.reduce(
    (acc, emp) => {
      if (emp.workplaceType) {
        acc[emp.workplaceType] = (acc[emp.workplaceType] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  ),
}));

// Loading state helpers
export const selectIsAnyLoading = createSelector(
  [
    selectContractsLoading,
    selectContractOffersLoading,
    selectEmploymentLoading,
    selectAnalyticsLoading,
  ],
  (contractsLoading, contractOffersLoading, employmentLoading, analyticsLoading) =>
    contractsLoading || contractOffersLoading || employmentLoading || analyticsLoading,
);

export const selectIsAnyOperationPending = createSelector(
  [
    selectIsCreating,
    selectIsUpdating,
    selectIsDeleting,
    selectIsSending,
    selectIsSigning,
    selectIsGeneratingAI,
    selectIsBulkOperating,
  ],
  (isCreating, isUpdating, isDeleting, isSending, isSigning, isGeneratingAI, isBulkOperating) =>
    isCreating ||
    isUpdating ||
    isDeleting ||
    isSending ||
    isSigning ||
    isGeneratingAI ||
    isBulkOperating,
);

// Error state helpers
export const selectAnyError = createSelector(
  [selectContractsError, selectContractOffersError, selectEmploymentError, selectAnalyticsError],
  (contractsError, contractOffersError, employmentError, analyticsError) =>
    contractsError || contractOffersError || employmentError || analyticsError,
);

// Recent activity with enhanced information
export const selectRecentContractActivity = createSelector(
  [selectContracts, selectContractOffers, selectEmployment],
  (contracts, contractOffers, employment) => {
    const activities = [
      ...contracts.map((contract) => ({
        type: 'contract_created' as const,
        id: contract.id,
        title: contract.title,
        date: contract.createdAt,
        status: contract.status,
        category: contract.category,
        entity: contract,
      })),
      ...contractOffers.map((offer) => ({
        type: 'contract_sent' as const,
        id: offer.id,
        title: `Contract sent to candidate`,
        date: offer.sentAt,
        status: offer.status,
        entity: offer,
      })),
      ...contractOffers
        .filter((offer) => offer.status === 'signed' && offer.signedAt)
        .map((offer) => ({
          type: 'contract_signed' as const,
          id: offer.id,
          title: `Contract signed`,
          date: offer.signedAt!,
          status: offer.status,
          entity: offer,
        })),
      ...employment.map((emp) => ({
        type: 'employment_created' as const,
        id: emp.id,
        title: `Employment record created`,
        date: emp.createdAt,
        status: emp.isActive ? 'active' : 'inactive',
        entity: emp,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20); // Last 20 activities
  },
);

// Quick Filters
export const selectQuickFilters = createSelector(
  [selectContracts, selectContractOffers],
  (contracts, offers) => ({
    needsAttention: contracts.filter((c) => c.status === 'draft').length,
    mostUsed: contracts.filter((c) => c.usageCount > 0).length,
    favorites: contracts.filter((c) => c.isFavorite).length,
    pendingOffers: offers.filter((o) => o.status === 'sent').length,
    recentlyCreated: contracts.filter(
      (c) => new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length,
  }),
);

// Contract Offer Statistics
export const selectContractOfferStats = createSelector([selectContractOffers], (offers) => {
  const totalSent = offers.length;
  const totalSigned = offers.filter((o) => o.status === 'signed').length;
  const totalRejected = offers.filter((o) => o.status === 'rejected').length;
  const totalPending = offers.filter((o) => o.status === 'sent').length;

  const signedRate = totalSent > 0 ? (totalSigned / totalSent) * 100 : 0;
  const rejectedRate = totalSent > 0 ? (totalRejected / totalSent) * 100 : 0;
  const pendingRate = totalSent > 0 ? (totalPending / totalSent) * 100 : 0;

  // Calculate average response time for signed/rejected contracts
  const respondedOffers = offers.filter((o) => o.status !== 'sent');
  const avgResponseTime =
    respondedOffers.length > 0
      ? respondedOffers.reduce((acc, offer) => {
          const sentDate = new Date(offer.sentAt);
          const responseDate = new Date(offer.signedAt || offer.rejectedAt || offer.sentAt);
          return acc + (responseDate.getTime() - sentDate.getTime());
        }, 0) / respondedOffers.length
      : 0;

  return {
    totalSent,
    totalSigned,
    totalRejected,
    totalPending,
    signedRate,
    rejectedRate,
    pendingRate,
    avgResponseTime: Math.round(avgResponseTime / (1000 * 60 * 60 * 24)), // Convert to days
  };
});

// Filtered Contract Offers
export const selectFilteredContractOffers = createSelector(
  [
    selectContractOffers,
    (state: RootState, filters: { search?: string; status?: string; contractId?: string }) =>
      filters,
  ],
  (offers, filters) => {
    return offers.filter((offer) => {
      const matchesSearch =
        !filters.search ||
        offer.candidate?.firstName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        false ||
        offer.candidate?.lastName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        false ||
        offer.candidate?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        false ||
        offer.contract?.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        false;

      const matchesStatus =
        !filters.status || filters.status === 'all' || offer.status === filters.status;

      const matchesContract =
        !filters.contractId ||
        filters.contractId === 'all' ||
        offer.contract?.id === filters.contractId;

      return matchesSearch && matchesStatus && matchesContract;
    });
  },
);
