import React from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import ContractOfferStatus from './ContractOfferStatus';

interface OffersTabProps {
  candidate: CandidateWithEvaluation;
  onSendContract?: () => void;
}

const OffersTab: React.FC<OffersTabProps> = ({ candidate, onSendContract }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-6">
        {/* Contract Offer Status */}
        <ContractOfferStatus
          candidateId={candidate.id}
          onSendContract={onSendContract}
          candidate={candidate}
        />
      </div>
    </div>
  );
};

export default OffersTab;
