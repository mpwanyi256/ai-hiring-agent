import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchContractOffers } from '@/store/contracts/contractsThunks';
import {
  selectContractOffers,
  selectContractOffersLoading,
} from '@/store/contracts/contractsSelectors';
import { formatCurrency, getContractStatusBadge, formatDate } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Modal from '../ui/Modal';
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
  Eye,
  Edit,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface ContractOfferStatusProps {
  candidateId: string;
  onSendContract?: () => void;
  candidate?: {
    status: string;
  };
}

const ContractOfferStatus: React.FC<ContractOfferStatusProps> = ({
  candidateId,
  onSendContract,
  candidate,
}) => {
  const dispatch = useAppDispatch();
  const contractOffers = useAppSelector(selectContractOffers);
  const loading = useAppSelector(selectContractOffersLoading);

  // Modal states
  const [showViewContractModal, setShowViewContractModal] = useState(false);
  const [showResendContractModal, setShowResendContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  // Filter contract offers for this specific candidate
  const candidateOffers = contractOffers.filter((offer) => offer.candidateId === candidateId);

  useEffect(() => {
    // Fetch contract offers when component mounts
    dispatch(fetchContractOffers());
  }, [dispatch]);

  // Helper functions
  const handleViewContract = (offer: any) => {
    setSelectedContract(offer);
    setShowViewContractModal(true);
  };

  const handleResendContract = (offer: any) => {
    setSelectedContract(offer);
    setShowResendContractModal(true);
  };

  const canSendContract =
    candidate && ['shortlisted', 'reference_check', 'offer_extended'].includes(candidate.status);

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <FileSignature className="h-5 w-5 mr-2" />
              Contract Offers
            </CardTitle>
            <Button variant="default" size="sm" onClick={onSendContract}>
              <FileText className="h-4 w-4 mr-1" />
              Send Contract
            </Button>
          </div>
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
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <FileSignature className="h-5 w-5 mr-2" />
              Contract Offers ({candidateOffers.length})
            </CardTitle>
            {onSendContract && canSendContract && (
              <Button variant="default" size="sm" onClick={onSendContract}>
                <FileText className="h-4 w-4 mr-1" />
                Send Contract
              </Button>
            )}
          </div>
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

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 ml-2">
                        {(offer.status === 'sent' || offer.status === 'signed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewContract(offer)}
                            className="h-7 px-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                        {offer.status === 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendContract(offer)}
                            className="h-7 px-2"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Resend
                          </Button>
                        )}
                      </div>
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
                        <h5 className="text-sm font-medium text-gray-900 mb-2">
                          Additional Terms:
                        </h5>
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

      {/* View Contract Modal */}
      <Modal
        isOpen={showViewContractModal}
        onClose={() => setShowViewContractModal(false)}
        title={selectedContract?.status === 'signed' ? 'Signed Contract' : 'Contract Details'}
        size="xl"
      >
        {selectedContract && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold">
                {selectedContract.contract?.title || 'Contract Offer'}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={getContractStatusBadge(selectedContract.status).className}
                >
                  {getContractStatusBadge(selectedContract.status).label}
                </Badge>
              </div>
            </div>

            {/* Show PDF viewer for signed contracts */}
            {selectedContract.status === 'signed' ? (
              <div className="space-y-4">
                {/* Contract metadata */}
                <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-700">Salary:</span>
                    <p className="text-gray-900">
                      {selectedContract.salaryAmount && selectedContract.salaryCurrency
                        ? formatCurrency(
                            selectedContract.salaryAmount,
                            selectedContract.salaryCurrency,
                          )
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Start Date:</span>
                    <p className="text-gray-900">
                      {selectedContract.startDate
                        ? formatDate(selectedContract.startDate)
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Signed:</span>
                    <p className="text-gray-900">{formatDate(selectedContract.signedAt)}</p>
                  </div>
                </div>

                {/* PDF Viewer */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">Signed Contract PDF:</span>
                    <a
                      href={`/api/contract-offers/${selectedContract.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Download PDF
                    </a>
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <iframe
                      src={`/api/contract-offers/${selectedContract.id}/view-pdf`}
                      className="w-full h-96 border-0"
                      title="Signed Contract PDF"
                    />
                  </div>
                </div>

                {/* Signature Display */}
                {selectedContract.additionalTerms?.signature && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="font-medium text-gray-700">Digital Signature:</span>
                    <div className="mt-2">
                      <SignatureDisplay
                        signature={selectedContract.additionalTerms.signature as any}
                        compact={false}
                        showMetadata={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Show contract details for non-signed contracts */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Salary:</span>
                    <p className="text-gray-900">
                      {selectedContract.salaryAmount && selectedContract.salaryCurrency
                        ? formatCurrency(
                            selectedContract.salaryAmount,
                            selectedContract.salaryCurrency,
                          )
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Start Date:</span>
                    <p className="text-gray-900">
                      {selectedContract.startDate
                        ? formatDate(selectedContract.startDate)
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sent:</span>
                    <p className="text-gray-900">{formatDate(selectedContract.sentAt)}</p>
                  </div>
                  {selectedContract.expiresAt && (
                    <div>
                      <span className="font-medium text-gray-700">Expires:</span>
                      <p className="text-gray-900">{formatDate(selectedContract.expiresAt)}</p>
                    </div>
                  )}
                </div>

                {selectedContract.contract?.content && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Contract Content:</span>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg max-h-80 overflow-y-auto">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">
                        {selectedContract.contract.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Resend Contract Modal */}
      <Modal
        isOpen={showResendContractModal}
        onClose={() => setShowResendContractModal(false)}
        title="Resend Contract"
        size="md"
      >
        {selectedContract && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>
                This contract was rejected by the candidate. You can update the contract details and
                resend it.
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Contract Rejected</span>
              </div>
              <p className="text-sm text-red-600">
                Rejected on: {formatDate(selectedContract.rejectedAt)}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={selectedContract.contract?.title || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Amount
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={selectedContract.salaryAmount || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={selectedContract.startDate || ''}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowResendContractModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  // TODO: Implement resend contract logic
                  console.log('Resending contract with updated details');
                  setShowResendContractModal(false);
                }}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-1" />
                Resend Contract
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ContractOfferStatus;
