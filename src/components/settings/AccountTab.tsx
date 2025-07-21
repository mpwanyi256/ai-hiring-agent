import React from 'react';

export default function AccountTab() {
  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Name</span>
            <div>
              <span className="font-medium">{/* User name here */} John Doe</span>
              <button className="ml-4 text-primary hover:underline text-sm">Edit</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Email</span>
            <div>
              <span className="font-medium">{/* User email here */} john@example.com</span>
              <button className="ml-4 text-primary hover:underline text-sm">Edit</button>
            </div>
          </div>
        </div>
      </div>
      {/* Password & Security Card */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-2">Password & Security</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Password</span>
          <button className="text-primary hover:underline text-sm">Change Password</button>
        </div>
        {/* Add 2FA, security settings here in the future */}
      </div>
    </div>
  );
}
