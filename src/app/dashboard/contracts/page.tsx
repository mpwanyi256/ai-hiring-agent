'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import {
  fetchContracts,
  fetchContractAnalytics,
  toggleContractFavorite,
  bulkUpdateContracts,
  bulkDeleteContracts,
} from '@/store/contracts/contractsThunks';
import {
  clearContractsError,
  toggleContractSelection,
  selectAllContracts,
  deselectAllContracts,
} from '@/store/contracts/contractsSlice';
import {
  selectContracts,
  selectContractsLoading,
  selectContractsError,
  selectContractsPagination,
  selectContractAnalytics,
  selectAnalyticsLoading,
  selectSelectedContracts,
  selectIsAnyContractSelected,
  selectSelectedContractsCount,
  selectIsAllContractsSelected,
  selectContractsByStatus,
  selectContractsByCategory,
  selectAllContractTags,
  selectIsBulkOperating,
  selectQuickFilters,
} from '@/store/contracts/contractsSelectors';
import { fetchJobTitles, fetchEmploymentTypes } from '@/store/jobs/jobsThunks';
import { selectJobTitles, selectEmploymentTypes } from '@/store/jobs/jobsSelectors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  ContractsFilters,
  ContractStatus,
  ContractCategory,
  BulkUpdateContractData,
} from '@/types/contracts';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  HeartIcon,
  FunnelIcon,
  ChartBarIcon,
  Squares2X2Icon,
  TagIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, CheckIcon } from '@heroicons/react/24/solid';
import { Loader2, Star, MoreHorizontal, Filter, TrendingUp, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CONTRACT_STATUS_OPTIONS: { value: ContractStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'blue' },
  { value: 'deprecated', label: 'Deprecated', color: 'red' },
];

const CONTRACT_CATEGORY_OPTIONS: { value: ContractCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical' },
  { value: 'executive', label: 'Executive' },
  { value: 'intern', label: 'Intern' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'custom', label: 'Custom' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'title', label: 'Title' },
  { value: 'usageCount', label: 'Usage Count' },
  { value: 'lastUsedAt', label: 'Last Used' },
];

export default function ContractsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const contracts = useSelector(selectContracts);
  const loading = useSelector(selectContractsLoading);
  const error = useSelector(selectContractsError);
  const pagination = useSelector(selectContractsPagination);
  const analytics = useSelector(selectContractAnalytics);
  const analyticsLoading = useSelector(selectAnalyticsLoading);
  const selectedContracts = useSelector(selectSelectedContracts);
  const isAnySelected = useSelector(selectIsAnyContractSelected);
  const selectedCount = useSelector(selectSelectedContractsCount);
  const isAllSelected = useSelector(selectIsAllContractsSelected);
  const contractsByStatus = useSelector(selectContractsByStatus);
  const contractsByCategory = useSelector(selectContractsByCategory);
  const allTags = useSelector(selectAllContractTags);
  const isBulkOperating = useSelector(selectIsBulkOperating);
  const quickFilters = useSelector(selectQuickFilters);

  // Job-related selectors for filtering
  const jobTitles = useSelector(selectJobTitles);
  const employmentTypes = useSelector(selectEmploymentTypes);

  const [filters, setFilters] = useState<ContractsFilters>({
    search: '',
    page: 1,
    limit: 12,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');

  useEffect(() => {
    dispatch(fetchContracts(filters));
    dispatch(fetchContractAnalytics());
    dispatch(fetchJobTitles());
    dispatch(fetchEmploymentTypes());
  }, [dispatch, filters]);

  const handleSearch = (searchTerm: string) => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof ContractsFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleToggleFavorite = async (contractId: string, isFavorite: boolean) => {
    await dispatch(toggleContractFavorite({ id: contractId, isFavorite: !isFavorite }));
    // Refresh contracts to show updated state
    dispatch(fetchContracts(filters));
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedContracts.length === 0) return;

    const bulkData: BulkUpdateContractData = {
      contractIds: selectedContracts,
      updates: {},
    };

    switch (bulkAction) {
      case 'delete':
        await dispatch(bulkDeleteContracts(selectedContracts));
        break;
      case 'active':
        bulkData.updates.status = 'active';
        await dispatch(bulkUpdateContracts(bulkData));
        break;
      case 'archived':
        bulkData.updates.status = 'archived';
        await dispatch(bulkUpdateContracts(bulkData));
        break;
      case 'favorite':
        bulkData.updates.isFavorite = true;
        await dispatch(bulkUpdateContracts(bulkData));
        break;
      case 'unfavorite':
        bulkData.updates.isFavorite = false;
        await dispatch(bulkUpdateContracts(bulkData));
        break;
    }

    // Reset selection and refresh
    dispatch(deselectAllContracts());
    setBulkAction('');
    dispatch(fetchContracts(filters));
  };

  const clearError = () => {
    dispatch(clearContractsError());
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      page: 1,
      limit: 12,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };

  if (loading && contracts.length === 0) {
    return (
      <DashboardLayout title="Contract Templates">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Contract Templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contract Templates</h1>
            <p className="text-muted-foreground">
              Create and manage reusable contract templates for your hiring process.
            </p>
          </div>
          <Link href="/dashboard/contracts/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </Link>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalContracts}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.recentActivity.contractsCreated} this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.recentActivity.contractsSigned} signed this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Signing Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(analytics.averageSigningTime)}h
                </div>
                <p className="text-xs text-muted-foreground">Time to sign contracts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.recentActivity.contractsSent}</div>
                <p className="text-xs text-muted-foreground">Sent this month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.isFavorite ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('isFavorite', filters.isFavorite ? undefined : true)}
          >
            <HeartIcon className="h-4 w-4 mr-1" />
            Favorites ({quickFilters.favorites})
          </Button>
          <Button
            variant={filters.status === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              handleFilterChange('status', filters.status === 'draft' ? undefined : 'draft')
            }
          >
            Drafts ({quickFilters.needsAttention})
          </Button>
          <Button
            variant={filters.status === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              handleFilterChange('status', filters.status === 'active' ? undefined : 'active')
            }
          >
            Active ({contractsByStatus.active.length})
          </Button>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        {/* Error Banner */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-red-800">{error}</p>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Search & Filter Templates</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contract templates..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => handleFilterChange('status', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {CONTRACT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select
                    value={filters.category || ''}
                    onValueChange={(value) => handleFilterChange('category', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {CONTRACT_CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select
                    value={filters.sortBy || 'updatedAt'}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Order</label>
                  <Select
                    value={filters.sortOrder || 'desc'}
                    onValueChange={(value) => handleFilterChange('sortOrder', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {isAnySelected && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="font-medium">
                    {selectedCount} template{selectedCount !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-2">
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Choose action..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Mark as Active</SelectItem>
                        <SelectItem value="archived">Archive</SelectItem>
                        <SelectItem value="favorite">Add to Favorites</SelectItem>
                        <SelectItem value="unfavorite">Remove from Favorites</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleBulkAction}
                      disabled={!bulkAction || isBulkOperating}
                      variant={bulkAction === 'delete' ? 'destructive' : 'default'}
                    >
                      {isBulkOperating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Apply
                    </Button>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => dispatch(deselectAllContracts())}>
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Select All Card */}
          {contracts.length > 0 && (
            <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
              <CardContent className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center space-y-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked: boolean | 'indeterminate') => {
                      if (checked) {
                        dispatch(selectAllContracts());
                      } else {
                        dispatch(deselectAllContracts());
                      }
                    }}
                    className="w-6 h-6"
                  />
                  <p className="text-sm text-muted-foreground">
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract Cards */}
          {contracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={selectedContracts.includes(contract.id)}
                        onCheckedChange={() => dispatch(toggleContractSelection(contract.id))}
                      />
                      <CardTitle className="text-lg">{contract.title}</CardTitle>
                    </div>
                    <CardDescription>
                      Created by {contract.createdByProfile?.firstName}{' '}
                      {contract.createdByProfile?.lastName}
                      {' • '}
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(contract.id, contract.isFavorite)}
                    >
                      {contract.isFavorite ? (
                        <HeartSolidIcon className="h-4 w-4 text-red-500" />
                      ) : (
                        <HeartIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/contracts/${contract.id}`}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status and Category Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={contract.status === 'active' ? 'default' : 'secondary'}
                      className={`${
                        contract.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : contract.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : contract.status === 'archived'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {CONTRACT_STATUS_OPTIONS.find((s) => s.value === contract.status)?.label}
                    </Badge>
                    <Badge variant="outline">
                      {CONTRACT_CATEGORY_OPTIONS.find((c) => c.value === contract.category)?.label}
                    </Badge>
                    {contract.jobTitle && (
                      <Badge variant="secondary">{contract.jobTitle.name}</Badge>
                    )}
                    {contract.employmentType && (
                      <Badge variant="outline">{contract.employmentType.name}</Badge>
                    )}
                  </div>

                  {/* Tags */}
                  {contract.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <TagIcon className="h-3 w-3 text-muted-foreground" />
                      {contract.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contract.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{contract.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Usage Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Used: {contract.usageCount} times</span>
                    {contract.lastUsedAt && (
                      <span>Last: {new Date(contract.lastUsedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Contract Preview */}
                  <div className="bg-muted p-3 rounded-lg">
                    <div
                      className="prose prose-sm max-w-none line-clamp-2 text-sm"
                      dangerouslySetInnerHTML={{
                        __html: contract.body.substring(0, 150) + '...',
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/contracts/${contract.id}`}>
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {contracts.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contract templates found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {filters.search || filters.status || filters.category
                  ? 'No templates match your current filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first contract template.'}
              </p>
              {!filters.search && !filters.status && !filters.category && (
                <Link href="/dashboard/contracts/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create First Template
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              templates
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
