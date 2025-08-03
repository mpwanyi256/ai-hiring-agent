'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchContracts } from '@/store/contracts/contractsThunks';
import { fetchCurrencies } from '@/store/currencies/currenciesThunks';
import { selectCurrencies } from '@/store/currencies/currenciesSelectors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Send,
  Users,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
  Upload,
  Filter,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import CurrencySelect from '@/components/ui/CurrencySelect';
import { CandidateWithEvaluation } from '@/types/candidates';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
}

interface BulkContractData {
  contractId: string;
  salaryAmount: number;
  salaryCurrency: string;
  startDate: string;
  customMessage?: string;
  ccEmails?: string[];
}

export default function BulkContractOperations() {
  const dispatch = useDispatch<AppDispatch>();
  const { contracts, contractsLoading } = useSelector((state: RootState) => state.contracts);
  const { currencies } = useSelector((state: RootState) => state.currencies);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('shortlisted');
  const [jobFilter, setJobFilter] = useState<string>('all');

  // Bulk operation modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkData, setBulkData] = useState<BulkContractData>({
    contractId: '',
    salaryAmount: 0,
    salaryCurrency: 'USD',
    startDate: '',
    customMessage: '',
    ccEmails: [],
  });

  // Confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (contracts.length === 0) {
      dispatch(fetchContracts());
    }
  }, [dispatch, contracts.length]);

  useEffect(() => {
    if (currencies.length === 0) {
      dispatch(fetchCurrencies());
    }
  }, [dispatch, currencies.length]);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, statusFilter, jobFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/candidates?status=shortlisted');
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = candidates;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          candidate.firstName.toLowerCase().includes(term) ||
          candidate.lastName.toLowerCase().includes(term) ||
          candidate.email.toLowerCase().includes(term) ||
          candidate.jobTitle.toLowerCase().includes(term),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((candidate) => candidate.status === statusFilter);
    }

    // Job filter
    if (jobFilter !== 'all') {
      filtered = filtered.filter((candidate) => candidate.jobTitle === jobFilter);
    }

    setFilteredCandidates(filtered);
  };

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    const newSelected = new Set(selectedCandidates);
    if (checked) {
      newSelected.add(candidateId);
    } else {
      newSelected.delete(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(new Set(filteredCandidates.map((c) => c.id)));
    } else {
      setSelectedCandidates(new Set());
    }
  };

  const handleBulkSend = async () => {
    if (selectedCandidates.size === 0) {
      toast.error('Please select at least one candidate');
      return;
    }

    if (!bulkData.contractId || !bulkData.salaryAmount || !bulkData.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmBulkSend = async () => {
    try {
      setSending(true);
      setShowConfirmation(false);

      const selectedCandidatesList = Array.from(selectedCandidates);
      const bulkOperationData = {
        candidateIds: selectedCandidatesList,
        contractData: {
          ...bulkData,
          ccEmails: bulkData.ccEmails?.filter((email) => email.trim()) || [],
        },
      };

      const response = await fetch('/api/contracts/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkOperationData),
      });

      if (!response.ok) {
        throw new Error('Failed to send bulk contracts');
      }

      const result = await response.json();

      toast.success(`Successfully sent ${result.successCount} contract offers`);
      if (result.failureCount > 0) {
        toast.warning(`${result.failureCount} contracts failed to send`);
      }

      // Reset form and selections
      setIsBulkModalOpen(false);
      setSelectedCandidates(new Set());
      setBulkData({
        contractId: '',
        salaryAmount: 0,
        salaryCurrency: 'USD',
        startDate: '',
        customMessage: '',
        ccEmails: [],
      });
    } catch (error) {
      console.error('Error sending bulk contracts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send contracts');
    } finally {
      setSending(false);
    }
  };

  const getMinStartDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const uniqueJobTitles = Array.from(new Set(candidates.map((c) => c.jobTitle)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Contract Operations</h1>
          <p className="text-gray-600">Send contract offers to multiple candidates at once</p>
        </div>
        <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
          <DialogTrigger asChild>
            <Button disabled={selectedCandidates.size === 0}>
              <Send className="h-4 w-4 mr-2" />
              Send Contracts ({selectedCandidates.size})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Bulk Contract Offers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Contract Selection */}
              <div>
                <Label htmlFor="bulk-contract">Contract Template *</Label>
                <Select
                  value={bulkData.contractId}
                  onValueChange={(value) => setBulkData({ ...bulkData, contractId: value })}
                >
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
                          {contract.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary and Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bulk-salary">Salary Amount *</Label>
                  <Input
                    id="bulk-salary"
                    type="number"
                    placeholder="e.g., 75000"
                    value={bulkData.salaryAmount || ''}
                    onChange={(e) =>
                      setBulkData({ ...bulkData, salaryAmount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="bulk-currency">Currency *</Label>
                  <CurrencySelect
                    value={bulkData.salaryCurrency}
                    onValueChange={(value) => setBulkData({ ...bulkData, salaryCurrency: value })}
                    placeholder="Select currency"
                    showLabel={false}
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <Label htmlFor="bulk-start-date">Start Date *</Label>
                <Input
                  id="bulk-start-date"
                  type="date"
                  min={getMinStartDate()}
                  value={bulkData.startDate}
                  onChange={(e) => setBulkData({ ...bulkData, startDate: e.target.value })}
                />
              </div>

              {/* Custom Message */}
              <div>
                <Label htmlFor="bulk-message">Custom Message (Optional)</Label>
                <Textarea
                  id="bulk-message"
                  value={bulkData.customMessage}
                  onChange={(e) => setBulkData({ ...bulkData, customMessage: e.target.value })}
                  rows={4}
                  placeholder="Add a personalized message for all candidates..."
                />
              </div>

              {/* CC Emails */}
              <div>
                <Label htmlFor="bulk-cc">CC Additional Recipients (Optional)</Label>
                <Input
                  id="bulk-cc"
                  placeholder="hr@company.com, manager@company.com"
                  value={bulkData.ccEmails?.join(', ') || ''}
                  onChange={(e) =>
                    setBulkData({
                      ...bulkData,
                      ccEmails: e.target.value
                        .split(',')
                        .map((email) => email.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>

              {/* Selected Candidates Summary */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">
                    Selected Candidates ({selectedCandidates.size})
                  </span>
                </div>
                <div className="mt-2 text-sm text-blue-700">
                  {Array.from(selectedCandidates)
                    .slice(0, 3)
                    .map((id) => {
                      const candidate = candidates.find((c) => c.id === id);
                      return candidate ? `${candidate.firstName} ${candidate.lastName}` : '';
                    })
                    .join(', ')}
                  {selectedCandidates.size > 3 && ` and ${selectedCandidates.size - 3} more`}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkSend}>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedCandidates.size} Candidates
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selection Summary */}
      {selectedCandidates.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {selectedCandidates.size} candidate{selectedCandidates.size !== 1 ? 's' : ''}{' '}
                  selected
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedCandidates(new Set())}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interviewed">Interviewed</SelectItem>
                <SelectItem value="offer_pending">Offer Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {uniqueJobTitles.map((job) => (
                  <SelectItem key={job} value={job}>
                    {job}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Candidates ({filteredCandidates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredCandidates.length > 0 &&
                        selectedCandidates.size === filteredCandidates.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCandidates.has(candidate.id)}
                        onCheckedChange={(checked) =>
                          handleSelectCandidate(candidate.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {candidate.firstName} {candidate.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.jobTitle}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          candidate.status === 'shortlisted'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : candidate.status === 'interviewed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }
                      >
                        {candidate.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(candidate.appliedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredCandidates.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No candidates found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || statusFilter !== 'all' || jobFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No shortlisted candidates available'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Contract Send</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send contract offers to {selectedCandidates.size} candidate
              {selectedCandidates.size !== 1 ? 's' : ''}. This action cannot be undone. Are you sure
              you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Contracts
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
