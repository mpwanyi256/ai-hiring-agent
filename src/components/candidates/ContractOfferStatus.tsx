import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchContractOffers } from '@/store/contracts/contractsThunks';
import {
  selectContractOffers,
  selectContractOffersLoading,
} from '@/store/contracts/contractsSelectors';
import { formatCurrency, getContractStatusBadge, formatDate } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import SignatureDisplay from '../contracts/SignatureDisplay';
import {
  FileSignature,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  Loader2,
} from 'lucide-react';

interface ContractOfferStatusProps {
  candidateId: string;
}

const ContractOfferStatus: React.FC<ContractOfferStatusProps> = ({ candidateId }) => {
  const dispatch = useAppDispatch();
  const contractOffers = useAppSelector(selectContractOffers);
  const loading = useAppSelector(selectContractOffersLoading);

  // Filter contract offers for this specific candidate
  const candidateOffers = contractOffers.filter((offer) => offer.candidateId === candidateId);

  useEffect(() => {
    // Fetch contract offers when component mounts
    dispatch(fetchContractOffers());
  }, [dispatch]);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileSignature className="h-5 w-5 mr-2" />
            Contract Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading contract offers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (candidateOffers.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileSignature className="h-5 w-5 mr-2" />
            Contract Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileSignature className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No contract offers sent</p>
            <p className="text-xs text-gray-400 mt-1">
              Contract offers will appear here once sent to the candidate
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-4 w-4" />;
      case 'signed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  const isExpired = (offer: any) => {
    return offer.status === 'sent' && new Date(offer.expiresAt) < new Date();
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FileSignature className="h-5 w-5 mr-2" />
          Contract Offers ({candidateOffers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {candidateOffers.map((offer) => {
            const statusBadge = getContractStatusBadge(offer.status);
            const expired = isExpired(offer);

            return (
              <div
                key={offer.id}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(offer.status)}
                    <h4 className="font-medium text-gray-900">
                      {offer.contract?.title || 'Contract Offer'}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={statusBadge.className}>
                      {statusBadge.label}
                    </Badge>
                    {expired && (
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="font-medium">Salary:</span>
                      <span className="ml-1">
                        {offer.salaryAmount && offer.salaryCurrency
                          ? formatCurrency(offer.salaryAmount, offer.salaryCurrency)
                          : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="font-medium">Start Date:</span>
                      <span className="ml-1">
                        {offer.startDate ? formatDate(offer.startDate) : 'Not specified'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Send className="h-4 w-4 mr-1" />
                      <span className="font-medium">Sent:</span>
                      <span className="ml-1">{formatDate(offer.sentAt)}</span>
                    </div>
                    {offer.signedAt && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="font-medium">Signed:</span>
                        <span className="ml-1">{formatDate(offer.signedAt)}</span>
                      </div>
                    )}
                    {offer.rejectedAt && (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-1" />
                        <span className="font-medium">Rejected:</span>
                        <span className="ml-1">{formatDate(offer.rejectedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {offer.status === 'sent' && !expired && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Expires: {formatDate(offer.expiresAt)}</span>
                    </div>
                  </div>
                )}

                {/* Signature Display */}
                {offer.status === 'signed' &&
                  offer.additionalTerms?.signature &&
                  typeof offer.additionalTerms.signature === 'object' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Signature:</h5>
                      <SignatureDisplay
                        signature={offer.additionalTerms.signature as any}
                        compact={true}
                        showMetadata={false}
                        className="mb-2"
                      />
                    </div>
                  )}

                {/* Additional Terms (excluding signature) */}
                {offer.additionalTerms &&
                  Object.keys(offer.additionalTerms).filter((key) => key !== 'signature').length >
                    0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Additional Terms:</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        {Object.entries(offer.additionalTerms)
                          .filter(([key]) => key !== 'signature')
                          .map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium capitalize">
                                {key.replace('_', ' ')}:
                              </span>
                              <span className="ml-2">{String(value)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractOfferStatus;
