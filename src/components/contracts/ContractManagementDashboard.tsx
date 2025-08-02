'use client';

import { useState, useEffect } from 'react';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import { fetchContracts, fetchContractOffers } from '@/store/contracts/contractsThunks';
import {
  selectContracts,
  selectContractOffers,
  selectContractOffersLoading,
  selectContractOfferStats,
  selectFilteredContractOffers,
} from '@/store/contracts/contractsSelectors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ContractOffer } from '@/types/contracts';

export default function ContractManagementDashboard() {
  const dispatch = useAppDispatch();

  // Redux selectors
  const contracts = useAppSelector(selectContracts);
  const contractOffers = useAppSelector(selectContractOffers);
  const loading = useAppSelector(selectContractOffersLoading);
  const stats = useAppSelector(selectContractOfferStats);

  // Local state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contractFilter, setContractFilter] = useState<string>('all');

  // Filtered offers using selector
  const filteredOffers = useAppSelector((state: RootState) =>
    selectFilteredContractOffers(state, {
      search: searchTerm,
      status: statusFilter,
      contractId: contractFilter,
    }),
  );

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = async () => {
    try {
      // Load contracts if not already loaded
      if (contracts.length === 0) {
        dispatch(fetchContracts());
      }

      // Fetch contract offers using thunk
      dispatch(fetchContractOffers());
    } catch (error) {
      console.error('Error loading contract management data:', error);
      toast.error('Failed to load contract data');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'signed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Signed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (offer: ContractOffer) => {
    return offer.status === 'sent' && new Date(offer.expiresAt) < new Date();
  };

  const handleResendContract = async (offerId: string) => {
    try {
      const response = await fetch(`/api/contract-offers/${offerId}/resend`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Contract resent successfully');
        dispatch(fetchContractOffers());
      } else {
        throw new Error('Failed to resend contract');
      }
    } catch (error) {
      console.error('Error resending contract:', error);
      toast.error('Failed to resend contract');
    }
  };

  const handleViewContract = (offerId: string, signingToken: string) => {
    const url = `/contract/${offerId}/sign?token=${signingToken}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading contract management data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contract Management</h1>
          <p className="text-gray-600">Track and manage all contract offers</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
              <p className="text-xs text-muted-foreground">Contract offers sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Signed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalSigned}</div>
              <p className="text-xs text-muted-foreground">
                {stats.signedRate.toFixed(1)}% acceptance rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalPending}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingRate.toFixed(1)}% pending response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Days to respond</p>
            </CardContent>
          </Card>
        </div>
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
                  placeholder="Search candidates, emails, or contracts..."
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
                <SelectItem value="sent">Pending</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by contract" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contract Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Offers ({filteredOffers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {offer.candidate?.firstName || 'N/A'} {offer.candidate?.lastName || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {offer.candidate?.email || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{offer.contract?.title || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(offer.status)}
                        {isExpired(offer) && (
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {offer.salaryAmount && offer.salaryCurrency
                        ? formatCurrency(offer.salaryAmount, offer.salaryCurrency)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{offer.startDate ? formatDate(offer.startDate) : 'N/A'}</TableCell>
                    <TableCell>{formatDate(offer.sentAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewContract(offer.id, 'dummy-token')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Contract
                          </DropdownMenuItem>
                          {offer.status === 'sent' && (
                            <DropdownMenuItem onClick={() => handleResendContract(offer.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Resend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredOffers.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No contract offers found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || statusFilter !== 'all' || contractFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by sending contract offers to candidates'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
