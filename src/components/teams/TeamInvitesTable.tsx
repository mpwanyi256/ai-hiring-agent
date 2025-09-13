import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectInvites, selectIsLoading } from '@/store/teams/teamSelectors';
import { RootState } from '@/store';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { apiError, apiSuccess } from '@/lib/notification';
import { fetchTeamInvites } from '@/store/teams/teamsThunks';

export const TeamInvitesTable = () => {
  const dispatch = useAppDispatch();
  const invites = useAppSelector(selectInvites);
  const isLoading = useAppSelector(selectIsLoading);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set());
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());

  const handleRevokeInvite = async (inviteId: string, inviteName: string) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${inviteName}?`)) {
      return;
    }

    setRevokingIds((prev) => new Set(prev).add(inviteId));

    try {
      const response = await fetch(`/api/teams/invite/${inviteId}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke invitation');
      }

      apiSuccess(`Invitation for ${inviteName} has been revoked`);

      // Refresh the invites list
      if (user?.companyId) {
        dispatch(fetchTeamInvites({ companyId: user.companyId, page: 1 }));
      }
    } catch (error) {
      console.error('Error revoking invitation:', error);
      apiError(error instanceof Error ? error.message : 'Failed to revoke invitation');
    } finally {
      setRevokingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(inviteId);
        return newSet;
      });
    }
  };

  const handleResendInvite = async (inviteId: string, inviteName: string) => {
    setResendingIds((prev) => new Set(prev).add(inviteId));

    try {
      const response = await fetch(`/api/teams/invite/${inviteId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend invitation');
      }

      apiSuccess(`Invitation resent to ${inviteName}`);
    } catch (error) {
      console.error('Error resending invitation:', error);
      apiError(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setResendingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(inviteId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded shadow border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left font-semibold">NAME</th>
            <th className="px-4 py-2 text-left font-semibold">EMAIL</th>
            <th className="px-4 py-2 text-left font-semibold">ROLE</th>
            <th className="px-4 py-2 text-left font-semibold">STATUS</th>
            <th className="px-4 py-2 text-left font-semibold">EXPIRES</th>
            <th className="px-4 py-2 text-right font-semibold">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => {
            const inviteName = `${invite.first_name} ${invite.last_name}`;
            const isRevoking = revokingIds.has(invite.id);
            const isResending = resendingIds.has(invite.id);
            const canRevoke = invite.status === 'pending';
            const canResend = invite.status === 'pending';

            return (
              <tr key={invite.id} className="border-t">
                <td className="px-4 py-2">{inviteName}</td>
                <td className="px-4 py-2">{invite.email}</td>
                <td className="px-4 py-2 capitalize">{invite.role}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(invite.status)}`}
                  >
                    {invite.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end space-x-2">
                    {canResend && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResendInvite(invite.id, inviteName)}
                        disabled={isResending || isLoading}
                        className="text-xs"
                      >
                        {isResending ? (
                          <>
                            <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <ArrowPathIcon className="h-3 w-3 mr-1" />
                            Resend
                          </>
                        )}
                      </Button>
                    )}
                    {canRevoke && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevokeInvite(invite.id, inviteName)}
                        disabled={isRevoking || isLoading}
                        className="text-xs text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                      >
                        {isRevoking ? (
                          <>
                            <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                            Revoking...
                          </>
                        ) : (
                          <>
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
