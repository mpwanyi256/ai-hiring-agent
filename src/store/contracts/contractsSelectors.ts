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

// UI State
export const selectIsCreating = (state: RootState) => state.contracts.isCreating;
export const selectIsUpdating = (state: RootState) => state.contracts.isUpdating;
export const selectIsDeleting = (state: RootState) => state.contracts.isDeleting;
export const selectIsSending = (state: RootState) => state.contracts.isSending;
export const selectIsSigning = (state: RootState) => state.contracts.isSigning;

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

// Statistics selectors
export const selectContractsStats = createSelector([selectContracts], (contracts) => ({
  total: contracts.length,
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
  [selectContractsLoading, selectContractOffersLoading, selectEmploymentLoading],
  (contractsLoading, contractOffersLoading, employmentLoading) =>
    contractsLoading || contractOffersLoading || employmentLoading,
);

export const selectIsAnyOperationPending = createSelector(
  [selectIsCreating, selectIsUpdating, selectIsDeleting, selectIsSending, selectIsSigning],
  (isCreating, isUpdating, isDeleting, isSending, isSigning) =>
    isCreating || isUpdating || isDeleting || isSending || isSigning,
);

// Error state helpers
export const selectAnyError = createSelector(
  [selectContractsError, selectContractOffersError, selectEmploymentError],
  (contractsError, contractOffersError, employmentError) =>
    contractsError || contractOffersError || employmentError,
);

// Recent activity
export const selectRecentContractActivity = createSelector(
  [selectContracts, selectContractOffers, selectEmployment],
  (contracts, contractOffers, employment) => {
    const activities = [
      ...contracts.map((contract) => ({
        type: 'contract_created' as const,
        id: contract.id,
        title: contract.title,
        date: contract.createdAt,
        entity: contract,
      })),
      ...contractOffers.map((offer) => ({
        type: 'contract_sent' as const,
        id: offer.id,
        title: `Contract sent to candidate`,
        date: offer.sentAt,
        entity: offer,
      })),
      ...contractOffers
        .filter((offer) => offer.status === 'signed' && offer.signedAt)
        .map((offer) => ({
          type: 'contract_signed' as const,
          id: offer.id,
          title: `Contract signed`,
          date: offer.signedAt!,
          entity: offer,
        })),
      ...employment.map((emp) => ({
        type: 'employment_created' as const,
        id: emp.id,
        title: `Employment record created`,
        date: emp.createdAt,
        entity: emp,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Last 10 activities
  },
);
