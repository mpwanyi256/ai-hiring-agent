'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import TeamTabs from '@/components/teams/TeamTabs';
import TeamFilterSearch from '@/components/teams/TeamFilterSearch';
import { TeamMembersTable } from '@/components/teams/TeamMembersTable';
import { TeamInvitesTable } from '@/components/teams/TeamInvitesTable';
import InviteMemberModal from '@/components/teams/InviteMemberModal';
import TeamAuditLog from '@/components/teams/TeamAuditLog';
import { fetchTeamInvites, fetchTeamMembers } from '@/store/teams/teamsThunks';
import {
  selectMembersHasMore,
  selectMembersLoading,
  selectMembersPage,
  selectMembersTotalCount,
} from '@/store/teams/teamSelectors';
import { selectInvites } from '@/store/teams/teamSelectors';
import { resetInvites, resetMembers } from '@/store/teams/teamsSlice';
import { selectIsOnStarterPlan } from '@/store/billing/billingSelectors';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

const TeamsPage = () => {
  const dispatch = useAppDispatch();
  const membersPage = useAppSelector(selectMembersPage);
  const membersHasMore = useAppSelector(selectMembersHasMore);
  const membersLoading = useAppSelector(selectMembersLoading);
  const membersTotalCount = useAppSelector(selectMembersTotalCount);
  const invites = useAppSelector(selectInvites);
  const [activeTab, setActiveTab] = React.useState('member');
  const [roleFilter, setRoleFilter] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const companyId = useAppSelector((state: RootState) => state.auth.user?.companyId);
  const user = useAppSelector((state: RootState) => state.auth.user);
  const isOnStarterPlan = useAppSelector(selectIsOnStarterPlan);

  // Subscription guard - redirect to pricing if no active subscription
  const { isSubscriptionValid } = useSubscriptionGuard({
    allowTrialing: true,
    bypassFor: ['admin', 'hr'],
  });

  // Infinite scroll observer - moved before conditional returns
  const loadMore = useCallback(() => {
    if (!companyId || membersLoading || !membersHasMore) return;
    dispatch(fetchTeamMembers({ companyId, page: membersPage, search }));
  }, [companyId, membersLoading, membersHasMore, membersPage, search, dispatch]);

  // Initial load and search - moved before conditional returns
  useEffect(() => {
    if (!companyId) return;
    dispatch(fetchTeamMembers({ companyId, page: 1, search }));
    dispatch(fetchTeamInvites({ companyId, page: 1 }));

    return () => {
      Promise.all([dispatch(resetMembers()), dispatch(resetInvites())]);
    };
  }, [companyId, search, dispatch]);

  useEffect(() => {
    if (!sentinelRef.current || !membersHasMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });
    observer.current.observe(sentinelRef.current);
    return () => observer.current?.disconnect();
  }, [loadMore, membersHasMore]);

  // Don't render content if subscription is invalid (guard will redirect)
  if (!isSubscriptionValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Search handler
  const handleSearch = (val: string) => {
    setSearch(val);
    if (companyId) {
      dispatch(fetchTeamMembers({ companyId, page: 1, search: val || '' }));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Top bar actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="text-xl font-semibold">Team</div>
          {!isOnStarterPlan ? (
            <Button
              size="sm"
              className="bg-primary text-white flex items-center gap-2"
              onClick={() => setInviteOpen(true)}
              disabled={isOnStarterPlan}
            >
              <PlusIcon className="w-4 h-4" /> Invite Member
            </Button>
          ) : (
            <Link href="/pricing">
              <Button size="sm" className="bg-primary text-white flex items-center gap-2">
                <Crown className="w-4 h-4" /> Upgrade to Pro to invite members
              </Button>
            </Link>
          )}
        </div>
        <TeamTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          invitesCount={invites.length}
          membersCount={membersTotalCount}
        />
        {(activeTab === 'member' || activeTab === 'invitation') && (
          <TeamFilterSearch
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            search={search}
            setSearch={handleSearch}
          />
        )}
        {activeTab === 'member' ? (
          <>
            <TeamMembersTable />
            <div ref={sentinelRef} />
            {membersLoading && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : activeTab === 'invitation' ? (
          <TeamInvitesTable />
        ) : activeTab === 'activity' ? (
          <TeamAuditLog companyId={user?.companyId || ''} />
        ) : null}
        <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      </div>
    </DashboardLayout>
  );
};

export default TeamsPage;
