import React from 'react';

export default function ProfileTab() {
  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      <h2 className="text-xl font-semibold mb-4">Profile</h2>
      {/* Avatar Upload Card */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gray-200" />
        <div>
          <div className="font-medium">John Doe</div>
          <button className="mt-2 text-primary hover:underline text-sm">Change Avatar</button>
        </div>
      </div>
      {/* Display Name & Bio Card */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700">Display Name</span>
          <div>
            <span className="font-medium">John Doe</span>
            <button className="ml-4 text-primary hover:underline text-sm">Edit</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Bio</span>
          <div>
            <span className="font-medium">Short bio goes here...</span>
            <button className="ml-4 text-primary hover:underline text-sm">Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
