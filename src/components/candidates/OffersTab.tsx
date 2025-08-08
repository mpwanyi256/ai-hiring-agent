import React, { useState, useEffect } from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Loader2 } from 'lucide-react';

interface OffersTabProps {
  candidate: CandidateWithEvaluation;
  onSendContract?: () => void;
}

const OffersTab: React.FC<OffersTabProps> = ({ candidate, onSendContract }) => {
  const [contractOffers, setContractOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContractOffers();
  }, [candidate.id]);

  const fetchContractOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/candidates/${candidate.id}/contract-offers`);
      if (response.ok) {
        const data = await response.json();
        setContractOffers(data.offers || []);
      } else {
        setError('Failed to fetch contract offers');
      }
    } catch (err) {
      setError('Failed to fetch contract offers');
      console.error('Error fetching contract offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading contract offers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <Button variant="outline" onClick={fetchContractOffers}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Contract Offers</h3>
        {onSendContract && (
          <Button onClick={onSendContract} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Send Contract
          </Button>
        )}
      </div>

      {contractOffers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Contract Offers</h3>
            <p className="text-gray-500 mb-4">
              No contract offers have been sent to this candidate yet.
            </p>
            {onSendContract && (
              <Button onClick={onSendContract}>
                <Plus className="h-4 w-4 mr-2" />
                Send First Contract
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contractOffers.map((offer: any) => (
            <Card key={offer.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{offer.contractTitle}</CardTitle>
                  <Badge className={getStatusColor(offer.status)}>{offer.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Salary:</span>
                    <p className="font-medium">
                      {offer.salaryAmount?.toLocaleString()} {offer.salaryCurrency}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <p className="font-medium">
                      {offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sent:</span>
                    <p className="font-medium">{new Date(offer.sentAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Expires:</span>
                    <p className="font-medium">
                      {offer.expiresAt
                        ? new Date(offer.expiresAt).toLocaleDateString()
                        : 'No expiry'}
                    </p>
                  </div>
                </div>
                {offer.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <span className="text-red-700 text-sm font-medium">Rejection Reason:</span>
                    <p className="text-red-600 text-sm mt-1">{offer.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OffersTab;
