'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Send,
  Star,
  Eye,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Redux imports
import { useAppSelector, useAppDispatch } from '@/store';
import {
  fetchContracts,
  fetchContractAnalytics,
  deleteContract,
  updateContract,
  updateContractStatus,
} from '@/store/contracts/contractsThunks';
import {
  selectContracts,
  selectContractsLoading,
  selectContractsError,
  selectContractAnalytics,
  selectAnalyticsLoading,
  selectContractsPagination,
} from '@/store/contracts/contractsSelectors';
import { selectIsOnStarterPlan } from '@/store/billing/billingSelectors';

// Types from centralized file
import { ContractsFilters } from '@/types/contracts';
import { FeatureSubscriptionCard } from '@/components/billing/FeatureSubscriptionCard';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { useToast } from '@/components/providers/ToastProvider';

const CONTRACT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'yellow' },
  { value: 'deprecated', label: 'Deprecated', color: 'red' },
];

export default function ContractsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux selectors - moved before conditional returns
  const contracts = useAppSelector(selectContracts);
  const contractsLoading = useAppSelector(selectContractsLoading);
  const contractsError = useAppSelector(selectContractsError);
  const analytics = useAppSelector(selectContractAnalytics);
  const analyticsLoading = useAppSelector(selectAnalyticsLoading);
  const pagination = useAppSelector(selectContractsPagination);

  // Local state for filters and UI - moved before conditional returns
  const [filters, setFilters] = useState<ContractsFilters>({
    search: '',
    status: undefined,
    page: 1,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Billing selectors - moved before conditional returns
  const isOnStarterPlan = useAppSelector(selectIsOnStarterPlan);
  const { success, error: showError } = useToast();

  // Subscription guard - redirect to pricing if no active subscription
  const { isSubscriptionValid } = useSubscriptionGuard({
    allowTrialing: true,
    bypassFor: ['admin', 'hr'],
  });

  // Fetch data on component mount and when filters change
  useEffect(() => {
    dispatch(fetchContracts(filters));
    dispatch(fetchContractAnalytics());
  }, [dispatch, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof ContractsFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset page when other filters change
    }));
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback(
    async (action: string) => {
      if (selectedContracts.length === 0) return;

      try {
        switch (action) {
          case 'delete':
            await Promise.all(selectedContracts.map((id) => dispatch(deleteContract(id)).unwrap()));
            break;
          case 'archive':
            await Promise.all(
              selectedContracts.map((id) =>
                dispatch(updateContract({ id, status: 'archived' })).unwrap(),
              ),
            );
            break;
          default:
            break;
        }
        setSelectedContracts([]);
        dispatch(fetchContracts(filters));
      } catch (error) {
        console.error('Bulk action failed:', error);
      }
    },
    [selectedContracts, dispatch, filters],
  );

  // Handle contract selection
  const handleContractSelect = useCallback((contractId: string, checked: boolean) => {
    setSelectedContracts((prev) =>
      checked ? [...prev, contractId] : prev.filter((id) => id !== contractId),
    );
  }, []);

  // Handle inline status update
  const handleStatusUpdate = useCallback(
    async (contractId: string, newStatus: string) => {
      try {
        setUpdatingStatus(contractId);
        await dispatch(updateContractStatus({ id: contractId, status: newStatus })).unwrap();
        // Refresh contracts to ensure UI is up to date
        dispatch(fetchContracts(filters));
        success('Contract status updated successfully');
      } catch (error) {
        console.error('Failed to update contract status:', error);
        showError('Failed to update contract status');
      } finally {
        setUpdatingStatus(null);
      }
    },
    [dispatch, filters, success, showError],
  );

  // Don't render content if subscription is invalid (guard will redirect)
  if (!isSubscriptionValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleSelectAll = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(contracts.map((contract) => contract.id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Render analytics cards
  const renderAnalyticsCards = () => {
    if (analyticsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!analytics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-xs font-medium text-muted-foreground">Total Contracts</p>
                <p className="text-xl font-bold">{analytics.totalContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-xs font-medium text-muted-foreground">Active Contracts</p>
                <p className="text-xl font-bold">{analytics.contractsByStatus?.active || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-xs font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-xl font-bold">{analytics.conversionRate?.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-xs font-medium text-muted-foreground">Avg. Signing Time</p>
                <p className="text-xl font-bold">
                  {analytics.averageSigningTime?.toFixed(1) || 0}d
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render filters
  const renderFilters = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contracts..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status || ''}
            onValueChange={(value) =>
              handleFilterChange('status', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {CONTRACT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bulk Actions */}
          {selectedContracts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions ({selectedContracts.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render contracts table
  const renderContractsTable = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedContracts.length === contracts.length && contracts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-xs">Contract</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Usage</TableHead>
              <TableHead className="text-xs">Last Used</TableHead>
              <TableHead className="text-xs">Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedContracts.includes(contract.id)}
                    onCheckedChange={() =>
                      handleContractSelect(contract.id, !selectedContracts.includes(contract.id))
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{contract.title}</p>
                      {contract.isFavorite && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                    {contract.jobTitle && (
                      <p className="text-xs text-muted-foreground">{contract.jobTitle.name}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={contract.status}
                    onValueChange={(value) => handleStatusUpdate(contract.id, value)}
                    disabled={updatingStatus === contract.id}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      {updatingStatus === contract.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              CONTRACT_STATUS_OPTIONS.find((opt) => opt.value === contract.status)
                                ?.color === 'gray'
                                ? 'bg-gray-400'
                                : CONTRACT_STATUS_OPTIONS.find(
                                      (opt) => opt.value === contract.status,
                                    )?.color === 'green'
                                  ? 'bg-green-500'
                                  : CONTRACT_STATUS_OPTIONS.find(
                                        (opt) => opt.value === contract.status,
                                      )?.color === 'yellow'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                            }`}
                          />
                          {CONTRACT_STATUS_OPTIONS.find((opt) => opt.value === contract.status)
                            ?.label || contract.status}
                        </div>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                option.color === 'gray'
                                  ? 'bg-gray-400'
                                  : option.color === 'green'
                                    ? 'bg-green-500'
                                    : option.color === 'yellow'
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                              }`}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{contract.usageCount}</p>
                </TableCell>
                <TableCell>
                  <p className="text-xs text-muted-foreground">
                    {contract.lastUsedAt ? formatDate(contract.lastUsedAt) : 'Never'}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-xs text-muted-foreground">{formatDate(contract.createdAt)}</p>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center text-xs text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              contracts
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Error state
  if (contractsError) {
    return (
      <DashboardLayout
        title="Contract Templates"
        subtitle="Create and manage reusable contract templates for your hiring process"
        rightNode={
          <Link href="/dashboard/contracts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </Link>
        }
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Contracts</h3>
            <p className="text-muted-foreground mb-4">{contractsError}</p>
            <Button onClick={() => dispatch(fetchContracts(filters))}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Starter plan check
  if (isOnStarterPlan) {
    return (
      <FeatureSubscriptionCard
        title="Upgrade to Pro to create contracts"
        subtitle="Sorry, your plan does not include this feature. You can upgrade to pro to start creating contracts."
      />
    );
  }

  // Main render
  return (
    <DashboardLayout
      title="Contract Templates"
      subtitle="Create and manage reusable contract templates for your hiring process"
      loading={contractsLoading}
      rightNode={
        <Link href="/dashboard/contracts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Analytics Cards */}
        {renderAnalyticsCards()}

        {/* Filters */}
        {renderFilters()}

        {/* Contracts Table */}
        {contracts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first contract template.
              </p>
              <Link href="/dashboard/contracts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Contract Template
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          renderContractsTable()
        )}
      </div>
    </DashboardLayout>
  );
}
