import React, { useEffect } from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { fetchSelectedCandidateContractOffers } from '@/store/selectedCandidate/selectedCandidateThunks';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectSelectedCandidateContractOffers,
  selectSelectedCandidateLoading,
} from '@/store/selectedCandidate/selectedCandidateSelectors';
import ContractOfferStatus from './ContractOfferStatus';

interface OffersTabProps {
  candidate: CandidateWithEvaluation;
  onSendContract?: () => void;
}

const OffersTab: React.FC<OffersTabProps> = ({ candidate, onSendContract }) => {
  const dispatch = useAppDispatch();
  const contractOffers = useAppSelector(selectSelectedCandidateContractOffers);
  const loading = useAppSelector(selectSelectedCandidateLoading);

  useEffect(() => {
    dispatch(fetchSelectedCandidateContractOffers());
  }, [candidate.id, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading contract offers...</span>
      </div>
    );
  }

  if (contractOffers === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to fetch contract offers</p>
          <Button
            variant="outline"
            onClick={() => dispatch(fetchSelectedCandidateContractOffers())}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return <ContractOfferStatus candidateId={candidate.id} onSendContract={onSendContract} />;
};

export default OffersTab;
