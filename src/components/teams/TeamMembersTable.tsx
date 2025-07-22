import React from 'react';
import { TeamMember } from '@/types/teams';

export default function TeamMembersTable({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="overflow-x-auto bg-white rounded shadow border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left font-semibold">NAME</th>
              <th className="px-4 py-2 text-left font-semibold">EMAIL</th>
              <th className="px-4 py-2 text-left font-semibold">ROLE</th>
              <th className="px-4 py-2 text-left font-semibold">LAST LOGIN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="text-center text-gray-400 py-6">
                No team members found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto bg-white rounded shadow border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left font-semibold">NAME</th>
            <th className="px-4 py-2 text-left font-semibold">EMAIL</th>
            <th className="px-4 py-2 text-left font-semibold">ROLE</th>
            <th className="px-4 py-2 text-left font-semibold">LAST LOGIN</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-t">
              <td className="px-4 py-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                  {member.firstName[0]}
                </div>
                <span>
                  {member.firstName} {member.lastName}
                </span>
              </td>
              <td className="px-4 py-2">{member.email}</td>
              <td className="px-4 py-2 capitalize">{member.role}</td>
              <td className="px-4 py-2">Oct 13, 2023 07:31 PM</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
