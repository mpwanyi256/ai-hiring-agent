import React from 'react';
import { useAppSelector } from '@/store';
import { selectTeamMembers } from '@/store/teams/teamSelectors';
import { formatDate } from '@/lib/utils';

export const TeamMembersTable = () => {
  const members = useAppSelector(selectTeamMembers);

  return (
    <div className="overflow-x-auto bg-white rounded shadow border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left font-semibold">NAME</th>
            <th className="px-4 py-2 text-left font-semibold">EMAIL</th>
            <th className="px-4 py-2 text-left font-semibold">ROLE</th>
            <th className="px-4 py-2 text-left font-semibold">Joined</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-t">
              <td className="px-4 py-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                  {member.first_name.split('')[0]}
                </div>
                <span>
                  {member.first_name} {member.last_name}
                </span>
              </td>
              <td className="px-4 py-2">{member.email}</td>
              <td className="px-4 py-2 capitalize">{member.role}</td>
              <td className="px-4 py-2">{formatDate(member.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
