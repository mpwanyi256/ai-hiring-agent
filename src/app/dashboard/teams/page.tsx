'use client';
import React, { useEffect, useState } from 'react';
import { fetchTeam } from '@/store/teams/teamsThunks';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import TeamTabs from '@/components/teams/TeamTabs';
import TeamFilterSearch from '@/components/teams/TeamFilterSearch';
import TeamMembersTable from '@/components/teams/TeamMembersTable';
import TeamInvitesTable from '@/components/teams/TeamInvitesTable';
import InviteMemberModal from '@/components/teams/InviteMemberModal';

const TeamsPage = () => {
  const dispatch = useAppDispatch();
  const { members, invites } = useAppSelector((state: RootState) => state.teams);
  const [activeTab, setActiveTab] = useState('member');
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTeam());
  }, [dispatch]);

  // Filtered members
  const filteredMembers = members.filter(
    (m) =>
      (!roleFilter || m.role === roleFilter) &&
      (!search ||
        m.firstName.toLowerCase().includes(search.toLowerCase()) ||
        m.lastName.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())),
  );

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
        <TeamTabs activeTab={activeTab} setActiveTab={setActiveTab} invitesCount={invites.length} />
        <TeamFilterSearch
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          search={search}
          setSearch={setSearch}
        />
        {activeTab === 'member' ? (
          <TeamMembersTable members={filteredMembers} />
        ) : (
          <TeamInvitesTable invites={invites} />
        )}
        <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
        {/* TODO: Add pagination or Load More */}
      </div>
    </DashboardLayout>
  );
};

export default TeamsPage;
