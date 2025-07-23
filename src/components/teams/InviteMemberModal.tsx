import React, { useState } from 'react';
import { TeamRole, ROLES } from '@/types/teams';
import Button from '@/components/ui/Button';
import { inviteUser } from '@/store/teams/teamsThunks';
import { useAppDispatch, useAppSelector } from '@/store';
import { apiError } from '@/lib/notification';
import { selectIsLoading } from '@/store/teams/teamSelectors';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('employee');
  const [touched, setTouched] = useState(false);
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectIsLoading);

  const isValid = firstName && lastName && email && role;

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setTouched(true);
      if (!isValid) return;

      await dispatch(inviteUser({ firstName, lastName, email, role }));
    } catch (err) {
      apiError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setTouched(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-lg font-semibold mb-4">Invite New Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              className="border rounded px-3 py-2 w-1/2"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              className="border rounded px-3 py-2 w-1/2"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className="border rounded px-3 py-2 w-full"
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            required
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {touched && !isValid && (
            <div className="text-red-500 text-sm">All fields are required.</div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-white"
              isLoading={loading}
              disabled={!isValid || loading}
            >
              Invite
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
