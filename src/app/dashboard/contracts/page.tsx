'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
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
import { fetchContracts, fetchContractAnalytics } from '@/store/contracts/contractsThunks';
import {
  selectContracts,
  selectContractsLoading,
  selectContractsError,
  selectContractAnalytics,
  selectAnalyticsLoading,
  selectAnalyticsError,
  selectContractsPagination,
} from '@/store/contracts/contractsSelectors';

// Types from centralized file
import { ContractsFilters } from '@/types/contracts';

const CONTRACT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'yellow' },
  { value: 'deprecated', label: 'Deprecated', color: 'red' },
];

const CONTRACT_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General', color: 'blue' },
  { value: 'technical', label: 'Technical', color: 'purple' },
  { value: 'executive', label: 'Executive', color: 'indigo' },
  { value: 'intern', label: 'Intern', color: 'pink' },
  { value: 'freelance', label: 'Freelance', color: 'orange' },
  { value: 'custom', label: 'Custom', color: 'gray' },
];

export default function ContractsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux selectors
  const contracts = useAppSelector(selectContracts);
  const contractsLoading = useAppSelector(selectContractsLoading);
  const contractsError = useAppSelector(selectContractsError);
  const analytics = useAppSelector(selectContractAnalytics);
  const analyticsLoading = useAppSelector(selectAnalyticsLoading);
  const analyticsError = useAppSelector(selectAnalyticsError);
  const pagination = useAppSelector(selectContractsPagination);

  // Local state for filters and UI
  const [filters, setFilters] = useState<ContractsFilters>({
    search: '',
    status: undefined,
    category: undefined,
    page: 1,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    dispatch(fetchContracts(filters));
    dispatch(fetchContractAnalytics());
  }, [dispatch, filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof ContractsFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to page 1 when other filters change
    }));
  };

  // Handle contract selection
  const handleSelectContract = (contractId: string) => {
    setSelectedContracts((prev) =>
      prev.includes(contractId) ? prev.filter((id) => id !== contractId) : [...prev, contractId],
    );
  };

  const handleSelectAll = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(contracts.map((contract) => contract.id));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedContracts.length === 0) {
      toast.error('Please select contracts first');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          // TODO: Implement bulk delete
          toast.success(`Deleted ${selectedContracts.length} contracts`);
          break;
        case 'archive':
          // TODO: Implement bulk archive
          toast.success(`Archived ${selectedContracts.length} contracts`);
          break;
        case 'activate':
          // TODO: Implement bulk activate
          toast.success(`Activated ${selectedContracts.length} contracts`);
          break;
        default:
          break;
      }
      setSelectedContracts([]);
      dispatch(fetchContracts(filters));
    } catch (error) {
      toast.error('Failed to perform bulk action');
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
                <p className="text-xl font-bold">{analytics.activeContracts || 0}</p>
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
                <p className="text-xl font-bold">{analytics.averageSigningTime || 0}d</p>
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

          {/* Category Filter */}
          <Select
            value={filters.category || ''}
            onValueChange={(value) =>
              handleFilterChange('category', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CONTRACT_CATEGORY_OPTIONS.map((option) => (
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
              <TableHead className="text-xs">Category</TableHead>
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
                    onCheckedChange={() => handleSelectContract(contract.id)}
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
                    {contract?.tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {contract.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {contract.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            +{contract.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {CONTRACT_STATUS_OPTIONS.find((opt) => opt.value === contract.status)?.label ||
                      contract.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {CONTRACT_CATEGORY_OPTIONS.find((opt) => opt.value === contract.category)
                      ?.label || contract.category}
                  </Badge>
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
