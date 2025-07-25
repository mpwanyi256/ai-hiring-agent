import React from 'react';
import { useAppSelector } from '@/store';
import { selectInvites } from '@/store/teams/teamSelectors';

export const TeamInvitesTable = () => {
  const invites = useAppSelector(selectInvites);

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
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr key={invite.id} className="border-t">
              <td className="px-4 py-2">
                {invite.first_name} {invite.last_name}
              </td>
              <td className="px-4 py-2">{invite.email}</td>
              <td className="px-4 py-2 capitalize">{invite.role}</td>
              <td className="px-4 py-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                  {invite.status}
                </span>
              </td>
              <td className="px-4 py-2">
                {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
