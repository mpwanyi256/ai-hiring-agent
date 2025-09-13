'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState, useAppDispatch } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { UserDetails } from '@/types/admin';
import { fetchUsers } from '@/store/admin/adminThunks';
import {
  selectAdminUsers,
  selectAdminLoading,
  selectAdminError,
} from '@/store/admin/adminSelectors';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import {
  MagnifyingGlassIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function AdminUsers() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };

  // Redux state
  const users = useSelector(selectAdminUsers);
  const isLoading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);

  // Local state
  const [filteredUsers, setFilteredUsers] = useState<UserDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch users data using Redux
  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(fetchUsers());
    }
  }, [user, dispatch]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter - search across name, email, and company
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((userDetail) => {
        const fullName = `${userDetail.first_name || ''} ${userDetail.last_name || ''}`.trim();
        const email = userDetail.email || '';
        const companyName = userDetail.company_name || '';

        return (
          fullName.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          companyName.toLowerCase().includes(searchLower)
        );
      });
    }

    // Role filter - filter by exact role match
    if (roleFilter !== 'all') {
      filtered = filtered.filter((userDetail) => userDetail.role === roleFilter);
    }

    // Status filter - based on last_sign_in_at activity
    if (statusFilter !== 'all') {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (statusFilter === 'active') {
        // Active: signed in within last 7 days
        filtered = filtered.filter(
          (userDetail) =>
            userDetail.last_sign_in_at && new Date(userDetail.last_sign_in_at) >= sevenDaysAgo,
        );
      } else if (statusFilter === 'inactive') {
        // Inactive: never signed in OR signed in more than 30 days ago
        filtered = filtered.filter(
          (userDetail) =>
            !userDetail.last_sign_in_at || new Date(userDetail.last_sign_in_at) < thirtyDaysAgo,
        );
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const formatLastActive = (lastSignIn: string | null) => {
    if (!lastSignIn) return 'Never';

    const date = new Date(lastSignIn);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const getStatusBadge = (lastSignIn: string | null) => {
    if (!lastSignIn) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Never Active
        </span>
      );
    }

    const date = new Date(lastSignIn);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Active
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Recently Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'employer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewUser = (userDetail: UserDetails) => {
    setSelectedUser(userDetail);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">
                View and manage all system users and their activity
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {filteredUsers.length} Users
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading users</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">System Users</h2>

              {/* Inline Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-2 w-full sm:w-48 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="employer">Employer</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active (7 days)</option>
                  <option value="inactive">Inactive (30+ days)</option>
                </select>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'No users found matching your filters.'
                  : 'No users found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((userProfile) => (
                    <tr key={userProfile.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userProfile.first_name && userProfile.last_name
                                ? `${userProfile.first_name} ${userProfile.last_name}`
                                : 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500">{userProfile.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {userProfile.company_name || 'No Company'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userProfile.role)}`}
                        >
                          {userProfile.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(userProfile.last_sign_in_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatLastActive(userProfile.last_sign_in_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userProfile.user_created_at || '').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewUser(userProfile)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors"
                            title="View user details"
                          >
                            <EyeIcon className="h-4 w-4" />
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

        {/* User Details Modal */}
        <UserDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} user={selectedUser} />
      </div>
    </DashboardLayout>
  );
}
