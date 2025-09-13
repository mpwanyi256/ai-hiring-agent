'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RootState } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarIcon,
  GlobeAltIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  size_range: string | null;
  slug: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  timezone_name: string | null;
  country_name: string | null;
  user_count: number;
  job_count: number;
  active_jobs_count: number;
  creator_name: string | null;
}

export default function AdminCompanies() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };

  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch companies data
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/companies');

        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }

        const data = await response.json();
        setCompanies(data.companies || []);
        setFilteredCompanies(data.companies || []);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch companies');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchCompanies();
    }
  }, [user]);

  // Filter companies based on search and filters
  useEffect(() => {
    let filtered = companies;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (company.description &&
            company.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (company.website && company.website.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter((company) => company.industry === industryFilter);
    }

    // Size filter
    if (sizeFilter !== 'all') {
      filtered = filtered.filter((company) => company.size_range === sizeFilter);
    }

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, industryFilter, sizeFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSizeRangeBadgeColor = (sizeRange: string | null) => {
    if (!sizeRange) return 'bg-gray-100 text-gray-800';

    switch (sizeRange.toLowerCase()) {
      case '1-10':
        return 'bg-green-100 text-green-800';
      case '11-50':
        return 'bg-blue-100 text-blue-800';
      case '51-200':
        return 'bg-purple-100 text-purple-800';
      case '201-500':
        return 'bg-orange-100 text-orange-800';
      case '500+':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUniqueIndustries = () => {
    const industries = companies
      .map((c) => c.industry)
      .filter((industry, index, arr) => industry && arr.indexOf(industry) === index)
      .sort();
    return industries;
  };

  const getUniqueSizeRanges = () => {
    const sizes = companies
      .map((c) => c.size_range)
      .filter((size, index, arr) => size && arr.indexOf(size) === index)
      .sort();
    return sizes;
  };

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  const totalUsers = companies.reduce((sum, company) => sum + company.user_count, 0);
  const totalActiveJobs = companies.reduce((sum, company) => sum + company.active_jobs_count, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
              <p className="text-gray-600 mt-1">View and manage all companies on the platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {filteredCompanies.length} Companies
              </div>
              <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                {totalUsers} Users
              </div>
              <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                {totalActiveJobs} Active Jobs
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Industry Filter */}
            <div>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Industries</option>
                {getUniqueIndustries().map((industry) => (
                  <option key={industry} value={industry || ''}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Sizes</option>
                {getUniqueSizeRanges().map((size) => (
                  <option key={size} value={size || ''}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setIndustryFilter('all');
                  setSizeFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading companies</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Companies Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Platform Companies</h2>
          </div>

          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-6 text-center">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">
                {searchTerm || industryFilter !== 'all' || sizeFilter !== 'all'
                  ? 'No companies found matching your filters.'
                  : 'No companies found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry & Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jobs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {company.logo_url ? (
                              <Image
                                className="h-10 w-10 rounded-full"
                                src={company.logo_url}
                                alt={company.name}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{company.name}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {company.description || 'No description'}
                            </div>
                            {company.website && (
                              <div className="flex items-center text-xs text-blue-600 mt-1">
                                <GlobeAltIcon className="h-3 w-3 mr-1" />
                                <a
                                  href={
                                    company.website.startsWith('http')
                                      ? company.website
                                      : `https://${company.website}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  {company.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {company.industry || 'Not specified'}
                          </div>
                          {company.size_range && (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSizeRangeBadgeColor(company.size_range)}`}
                            >
                              {company.size_range} employees
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {company.user_count}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ChartBarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            <span className="font-medium text-green-600">
                              {company.active_jobs_count}
                            </span>
                            <span className="text-gray-500"> / {company.job_count}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {company.creator_name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(company.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View company details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 rounded"
                            title="Edit company"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Deactivate company"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
