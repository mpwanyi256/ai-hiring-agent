'use client';

import { useState, useEffect, Fragment } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchSigningOffer,
  signByCandidate,
  rejectByCandidate,
} from '@/store/contracts/contractsThunks';
import {
  selectSigningOffer,
  selectSigningLoading,
  selectSigningError,
} from '@/store/contracts/contractsSelectors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Building,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import SignatureModal from '@/components/contracts/SignatureModal';
import SignatureDisplay from '@/components/contracts/SignatureDisplay';

export default function ContractSigningPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const contractOfferId = params.id as string;
  const signingToken = searchParams.get('token') || '';

  const dispatch = useAppDispatch();
  const contractOffer = useAppSelector(selectSigningOffer);
  const loading = useAppSelector(selectSigningLoading);
  const error = useAppSelector(selectSigningError);

  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  useEffect(() => {
    if (!contractOfferId || !signingToken) return;
    dispatch(fetchSigningOffer({ offerId: contractOfferId, token: signingToken }));
  }, [dispatch, contractOfferId, signingToken]);

  const handleSignatureSubmit = async (signature: {
    type: 'typed' | 'drawn';
    data: string;
    fullName: string;
  }) => {
    if (!contractOffer) return;
    setActionLoading(true);
    try {
      await dispatch(
        signByCandidate({
          offerId: contractOffer.id,
          token: signingToken,
          signature: {
            type: signature.type,
            data: signature.data,
            fullName: signature.fullName,
            signedAt: new Date().toISOString(),
          },
        }),
      ).unwrap();
      toast.success('Contract signed successfully!');
      setShowSignatureModal(false);
    } catch (e) {
      toast.error('Failed to sign contract');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectContract = async () => {
    if (!contractOffer || !rejectionReason.trim().length) return;
    setActionLoading(true);
    try {
      await dispatch(
        rejectByCandidate({
          offerId: contractOfferId,
          token: signingToken,
          rejectionReason: rejectionReason.trim() || undefined,
        }),
      ).unwrap();
      toast.success('Contract rejected successfully.');
      setShowRejectionForm(false);
    } catch (e) {
      toast.error('Failed to reject contract');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadContract = async () => {
    if (!contractOffer || contractOffer.status !== 'signed' || !contractOffer.signedCopyUrl) {
      toast.error('Signed contract not available for download');
      return;
    }
    try {
      const response = await fetch(
        `/api/contract-offers/${contractOfferId}/download?token=${encodeURIComponent(signingToken)}`,
      );
      if (!response.ok) throw new Error('Failed to download contract');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${contractOffer.contract.title} - ${contractOffer.candidate.firstName} ${contractOffer.candidate.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error('Failed to download contract');
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const isExpired = !!contractOffer && new Date(contractOffer.expiresAt) < new Date();
  const canTakeAction = !!contractOffer && contractOffer.status === 'sent' && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading contract...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contractOffer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Contract Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">The contract offer could not be found or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Header = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Contract Offer
            </CardTitle>
            <p className="text-gray-600 mt-1">
              {contractOffer.contract.title} • {contractOffer.companyName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {contractOffer.status === 'sent' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
            {contractOffer.status === 'signed' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Signed
              </Badge>
            )}
            {contractOffer.status === 'rejected' && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <XCircle className="h-3 w-3 mr-1" />
                Rejected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  const StatusAlerts = () => (
    <Fragment>
      {isExpired && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            This contract offer expired on {formatDate(contractOffer.expiresAt)}. Please contact the
            hiring team if you need assistance.
          </AlertDescription>
        </Alert>
      )}
      {contractOffer.status === 'signed' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You signed this contract on{' '}
            {contractOffer.signedAt ? formatDate(contractOffer.signedAt) : 'Unknown date'}. A copy
            has been sent to your email address.
          </AlertDescription>
        </Alert>
      )}
      {contractOffer.status === 'rejected' && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You rejected this contract on{' '}
            {contractOffer.rejectedAt ? formatDate(contractOffer.rejectedAt) : 'Unknown date'}.
          </AlertDescription>
        </Alert>
      )}
    </Fragment>
  );

  const ContractTerms = () => (
    <Card className="h-[calc(100vh-350px)] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-lg">Contract Terms</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: contractOffer.contract.body }}
        />
      </CardContent>
    </Card>
  );

  const Actions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Decision</CardTitle>
        <p className="text-sm text-gray-600">
          Please review the contract terms above and choose your action below.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowSignatureModal(true)}
            disabled={actionLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Accept & Sign Offer
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectionForm(true)}
            disabled={actionLoading}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Decline Offer
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const RejectionForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-red-700">Decline Contract</CardTitle>
        <p className="text-sm text-gray-600">
          Please let us know why you’re declining this offer (optional).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="rejection-reason">Reason for declining (optional)</Label>
          <Textarea
            id="rejection-reason"
            placeholder="e.g., Salary doesn't meet expectations, found another opportunity, etc."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleRejectContract}
            disabled={actionLoading}
            variant="destructive"
            className="text-white"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Confirm Decline
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectionForm(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const OfferDetails = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building className="h-5 w-5" />
          Offer Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">Position</Label>
          <p className="text-sm">{contractOffer.contract.jobTitle.name}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Salary</Label>
          <p className="text-sm font-semibold">
            {contractOffer.salaryAmount && contractOffer.salaryCurrency
              ? formatCurrency(contractOffer.salaryAmount, contractOffer.salaryCurrency)
              : '—'}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Start Date</Label>
          <p className="text-sm">
            {contractOffer.startDate ? formatDate(contractOffer.startDate) : 'TBD'}
          </p>
        </div>
        {contractOffer.endDate && (
          <div>
            <Label className="text-sm font-medium text-gray-500">End Date</Label>
            <p className="text-sm">{formatDate(contractOffer.endDate)}</p>
          </div>
        )}
        <div>
          <Label className="text-sm font-medium text-gray-500">Offer Expires</Label>
          <p className="text-sm">{formatDate(contractOffer.expiresAt)}</p>
        </div>
      </CardContent>
    </Card>
  );

  const ContactCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-sm font-medium text-gray-500">Sent by</Label>
          <p className="text-sm">
            {contractOffer.sentByProfile.firstName} {contractOffer.sentByProfile.lastName}
          </p>
          <p className="text-xs text-gray-500">{contractOffer.sentByProfile.email}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Company</Label>
          <p className="text-sm">{contractOffer.companyName}</p>
        </div>
      </CardContent>
    </Card>
  );

  const ActionsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {contractOffer.status === 'signed' && contractOffer.signedCopyUrl ? (
          <Button variant="outline" onClick={downloadContract} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            View Signed Contract
          </Button>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              {contractOffer.status === 'sent'
                ? 'Download will be available after signing'
                : contractOffer.status === 'rejected'
                  ? 'Contract was rejected'
                  : 'No signed contract available'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header />
        <StatusAlerts />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ContractTerms />
            {contractOffer.additionalTerms?.signature && (
              <SignatureDisplay signature={contractOffer.additionalTerms.signature} />
            )}
            {canTakeAction && !showRejectionForm ? <Actions /> : null}
            {showRejectionForm ? <RejectionForm /> : null}
          </div>

          <div className="space-y-6">
            <OfferDetails />
            <ContactCard />
            <ActionsCard />
          </div>
        </div>
      </div>

      <SignatureModal
        isOpen={showSignatureModal && !actionLoading}
        onClose={() => setShowSignatureModal(false)}
        onSign={handleSignatureSubmit}
        candidateName={`${contractOffer.candidate.firstName} ${contractOffer.candidate.lastName}`}
        isLoading={actionLoading}
      />
    </div>
  );
}
