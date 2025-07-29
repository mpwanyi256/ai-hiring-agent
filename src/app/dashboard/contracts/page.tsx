'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { fetchContracts } from '@/store/contracts/contractsThunks';
import { clearContractsError } from '@/store/contracts/contractsSlice';
import {
  selectContracts,
  selectContractsLoading,
  selectContractsError,
  selectContractsPagination,
} from '@/store/contracts/contractsSelectors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContractsFilters } from '@/types/contracts';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ContractsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const contracts = useSelector(selectContracts);
  const loading = useSelector(selectContractsLoading);
  const error = useSelector(selectContractsError);
  const pagination = useSelector(selectContractsPagination);

  const [filters, setFilters] = useState<ContractsFilters>({
    search: '',
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    dispatch(fetchContracts(filters));
  }, [dispatch, filters]);

  const handleSearch = (searchTerm: string) => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const clearError = () => {
    dispatch(clearContractsError());
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
            <CardTitle>Search Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contract templates..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="grid gap-4">
          {contracts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No contract templates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first contract template to streamline your hiring process.
                  </p>
                  <Link href="/dashboard/contracts/new">
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            contracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{contract.title}</CardTitle>
                      <CardDescription className="mt-2">
                        Created by {contract.createdByProfile?.firstName}{' '}
                        {contract.createdByProfile?.lastName}
                        {' • '}
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {contract.jobTitle && (
                        <Badge variant="secondary">{contract.jobTitle.name}</Badge>
                      )}
                      {contract.employmentType && (
                        <Badge variant="outline">{contract.employmentType.name}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Contract Preview */}
                    <div className="bg-muted p-4 rounded-lg">
                      <div
                        className="prose prose-sm max-w-none line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html: contract.body.substring(0, 200) + '...',
                        }}
                      />
                    </div>

                    {/* Contract Details */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {contract.contractDuration && (
                        <span>Duration: {contract.contractDuration}</span>
                      )}
                      <span>Updated: {new Date(contract.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} templates
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
