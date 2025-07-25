import React from 'react';

const ROLES = [
  { label: 'All user role', value: '' },
  { label: 'Admin', value: 'admin' },
  { label: 'Employee', value: 'employee' },
  { label: 'Recruiter', value: 'recruiter' },
  { label: 'Developer', value: 'developer' },
];

export default function TeamFilterSearch({
  roleFilter,
  setRoleFilter,
  search,
  setSearch,
}: {
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <select
        className="border rounded px-3 py-1 text-sm"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        {ROLES.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Search"
        className="border rounded px-3 py-1 text-sm ml-2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}
