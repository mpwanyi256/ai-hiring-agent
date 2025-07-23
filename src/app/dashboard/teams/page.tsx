'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import TeamTabs from '@/components/teams/TeamTabs';
import TeamFilterSearch from '@/components/teams/TeamFilterSearch';
import { TeamMembersTable } from '@/components/teams/TeamMembersTable';
import { TeamInvitesTable } from '@/components/teams/TeamInvitesTable';
import InviteMemberModal from '@/components/teams/InviteMemberModal';
import { fetchTeamInvites, fetchTeamMembers } from '@/store/teams/teamsThunks';
import {
  selectMembersHasMore,
  selectMembersLoading,
  selectMembersPage,
  selectMembersTotalCount,
} from '@/store/teams/teamSelectors';
import { selectInvites } from '@/store/teams/teamSelectors';
import { resetInvites, resetMembers } from '@/store/teams/teamsSlice';

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

  // Initial load and search
  useEffect(() => {
    if (!companyId) return;
    dispatch(fetchTeamMembers({ companyId, page: 1, search }));
    dispatch(fetchTeamInvites({ companyId, page: 1 }));

    return () => {
      Promise.all([dispatch(resetMembers()), dispatch(resetInvites())]);
    };
  }, [companyId, search, dispatch]);

  // Infinite scroll observer
  const loadMore = useCallback(() => {
    if (!companyId || membersLoading || !membersHasMore) return;
    dispatch(fetchTeamMembers({ companyId, page: membersPage, search }));
  }, [companyId, membersLoading, membersHasMore, membersPage, search, dispatch]);

  useEffect(() => {
    if (!sentinelRef.current || !membersHasMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });
    observer.current.observe(sentinelRef.current);
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loadMore, membersHasMore]);

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
          <Button
            size="sm"
            className="bg-primary text-white flex items-center gap-2"
            onClick={() => setInviteOpen(true)}
          >
            <PlusIcon className="w-4 h-4" /> Invite Member
          </Button>
        </div>
        <TeamTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          invitesCount={invites.length}
          membersCount={membersTotalCount}
        />
        <TeamFilterSearch
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          search={search}
          setSearch={handleSearch}
        />
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
        ) : (
          <TeamInvitesTable />
        )}
        <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      </div>
    </DashboardLayout>
  );
};

export default TeamsPage;
