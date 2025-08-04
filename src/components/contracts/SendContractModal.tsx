'use client';

import { useState, useEffect } from 'react';
import { AppDispatch, useAppDispatch, useAppSelector } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, FileText, Calendar, Mail, Send, Loader2, CheckCircle } from 'lucide-react';
import { fetchContracts, sendContractOffer } from '@/store/contracts/contractsThunks';
import { selectContracts, selectContractsLoading } from '@/store/contracts/contractsSelectors';
import { fetchCurrencies } from '@/store/currencies/currenciesThunks';
import CurrencySelect from '@/components/ui/CurrencySelect';
import { CandidateWithEvaluation } from '@/types/candidates';
import { toast } from 'sonner';

interface SendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateWithEvaluation;
  jobTitle: string;
}

const SendContractModal: React.FC<SendContractModalProps> = ({
  isOpen,
  onClose,
  candidate,
  jobTitle,
}) => {
  const dispatch = useAppDispatch();
  const contracts = useAppSelector(selectContracts);
  const contractsLoading = useAppSelector(selectContractsLoading);

  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [salary, setSalary] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [startDate, setStartDate] = useState<string>('');
  const [ccEmails, setCcEmails] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const defaultMessage = `Hi ${candidate.firstName},

We are pleased to offer you the position of ${jobTitle}. Please review the attached contract and let us know if you have any questions.

We look forward to having you join our team!

Best regards,
The Hiring Team`;
  const [customMessage, setCustomMessage] = useState<string>(defaultMessage);

  // Load contracts and currencies when modal opens
  useEffect(() => {
    if (isOpen && contracts.length === 0) {
      dispatch(fetchContracts());
    }
    if (isOpen) {
      dispatch(fetchCurrencies());
    }
  }, [isOpen, dispatch, contracts.length]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedContractId('');
      setSalary('');
      setSelectedCurrency('USD');
      setStartDate('');
      setCustomMessage(defaultMessage);
      setCcEmails('');
      setIsSending(false);
    }
  }, [isOpen, defaultMessage]);

  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  const handleSendContract = async () => {
    if (!selectedContractId) {
      toast.error('Please select a contract template');
      return;
    }

    if (!salary.trim()) {
      toast.error('Please enter the salary amount');
      return;
    }

    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }

    setIsSending(true);

    try {
      // Parse salary amount from input
      const salaryInput = salary.trim();
      // let salaryAmount: number;

      // Extract numeric value from salary string (e.g., "75,000" -> 75000)
      const numericMatch = salaryInput.match(/([\d,]+(?:\.\d{2})?)/);
      if (!numericMatch) {
        toast.error('Please enter a valid salary amount');
        return;
      }

      const salaryAmount = parseFloat(numericMatch[1].replace(/,/g, ''));

      // Use selected currency from dropdown
      const salaryCurrency = selectedCurrency;

      const contractOfferData = {
        contractId: selectedContractId,
        candidateId: candidate.id,
        salaryAmount,
        salaryCurrency,
        startDate,
        customMessage: customMessage.trim() || undefined,
        ccEmails: ccEmails.trim() ? ccEmails.split(',').map((email) => email.trim()) : undefined,
      };

      const result = await dispatch(sendContractOffer(contractOfferData));

      if (sendContractOffer.fulfilled.match(result)) {
        toast.success('Contract sent successfully!');
        onClose();
      } else {
        throw new Error(result.error?.message || 'Failed to send contract');
      }
    } catch (error) {
      console.error('Error sending contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send contract');
    } finally {
      setIsSending(false);
    }
  };

  const getMinStartDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Contract Offer
          </DialogTitle>
          <DialogDescription>
            Send a contract offer to {candidate.firstName} {candidate.lastName} for the {jobTitle}{' '}
            position.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Candidate Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Candidate Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {candidate.firstName}{' '}
                  {candidate.lastName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {candidate.email}
                </div>
                <div>
                  <span className="font-medium">Position:</span> {jobTitle}
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Shortlisted
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Selection */}
          <div className="space-y-3">
            <Label htmlFor="contract-select" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Select Contract Template *
            </Label>
            <Select value={selectedContractId} onValueChange={setSelectedContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a contract template..." />
              </SelectTrigger>
              <SelectContent>
                {contractsLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading contracts...
                    </div>
                  </SelectItem>
                ) : contracts.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    No contract templates available
                  </SelectItem>
                ) : (
                  contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{contract.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {contract.category} • {contract.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedContract && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> {selectedContract.title}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Category: {selectedContract.category} • Duration:{' '}
                  {selectedContract.contractDuration || 'Not specified'}
                </p>
              </div>
            )}
          </div>

          {/* Contract Details */}
          <div className="space-y-4">
            {/* Salary/Compensation */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">Salary/Compensation *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="salary"
                  type="text"
                  placeholder="e.g., 75,000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />
                <CurrencySelect value={selectedCurrency} onValueChange={setSelectedCurrency} />
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date *
              </Label>
              <Input
                id="start-date"
                type="date"
                min={getMinStartDate()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Custom Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              You can customize this message or leave it as is
            </p>
          </div>

          {/* CC Emails */}
          <div className="space-y-2">
            <Label htmlFor="cc-emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              CC Additional Recipients (Optional)
            </Label>
            <Input
              id="cc-emails"
              type="text"
              placeholder="hr@company.com, manager@company.com"
              value={ccEmails}
              onChange={(e) => setCcEmails(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple email addresses with commas
            </p>
          </div>

          {/* Information Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>What happens next:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• The candidate will receive an email with the contract offer</li>
                <li>• They can review, sign, or reject the contract online</li>
                <li>• You&apos;ll be notified of their decision via email</li>
                <li>• Signed contracts will be automatically stored as PDFs</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSendContract}
            disabled={isSending || !selectedContractId || !salary.trim() || !startDate}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Contract...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Contract Offer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendContractModal;
