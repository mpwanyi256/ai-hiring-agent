import React, { useState } from 'react';
import { TeamRole, ROLES } from '@/types/teams';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { inviteUser } from '@/store/teams/teamsThunks';
import { useAppDispatch, useAppSelector } from '@/store';
import { apiError, apiSuccess } from '@/lib/notification';
import { selectIsLoading } from '@/store/teams/teamSelectors';
import { useAnalytics } from '@/hooks/useAnalytics';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
}

const NAME_MAX = 100;
const EMAIL_MAX = 100;

export default function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('employee');
  const [touched, setTouched] = useState(false);
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectIsLoading);

  // Initialize analytics tracking
  const analytics = useAnalytics();

  const nameLength = firstName.length + lastName.length;
  const isValid =
    firstName && lastName && email && role && nameLength <= NAME_MAX && email.length <= EMAIL_MAX;

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setTouched(true);
      if (!isValid) return;

      // Track form start
      analytics.trackFormStart('team_member_invite', 'teams');

      const response = await dispatch(inviteUser({ firstName, lastName, email, role })).unwrap();
      if (response.error) {
        analytics.trackFormSubmission('team_member_invite', false, 'teams');
        apiError(response.error);
        return;
      }

      // Track successful invitation
      analytics.trackTeamMemberInvited('invite_sent', role, 'modal');
      analytics.trackFormSubmission('team_member_invite', true, 'teams');

      apiSuccess('Invite sent successfully');
      onClose();
      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('employee');
      setTouched(false);
    } catch (err) {
      analytics.trackFormSubmission('team_member_invite', false, 'teams');
      apiError(err instanceof Error ? err.message : 'Failed to invite member');
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Invite team member"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary text-white ml-2"
            isLoading={loading}
            disabled={!isValid || loading}
            form="invite-member-form"
          >
            Invite
          </Button>
        </>
      }
      size="md"
    >
      <div className="text-gray-500 text-sm mb-6">
        Invite members to your team and start working together on getting done!
      </div>
      <form id="invite-member-form" onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            placeholder="First Name"
            value={firstName}
            maxLength={NAME_MAX}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            placeholder="Last Name"
            value={lastName}
            maxLength={NAME_MAX}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="text-xs text-gray-400 text-right mt-1">
          {nameLength}/{NAME_MAX}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full"
            placeholder="Enter Teammate's Email"
            value={email}
            maxLength={EMAIL_MAX}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {email.length}/{EMAIL_MAX}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            required
          >
            {ROLES.filter((r) => r.value !== 'admin').map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {touched && !isValid && (
          <div className="text-red-500 text-sm">
            All fields are required and must be under the character limit.
          </div>
        )}
      </form>
    </Modal>
  );
}
