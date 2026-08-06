// app/hoists/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Building2, ArrowLeft } from 'lucide-react';

export default function NewHoistPage() {
  const router = useRouter();
  // Simulating current user role. Pull from your actual Auth/Role state context.
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'customer' | 'technician'>('admin');

  if (currentUserRole === 'technician') {
    return (
      <div className="p-12 max-w-xl mx-auto mt-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-500">
          Technicians are not authorized to register new hoists to the fleet registry.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-2.5 bg-orange-50 text-[#FE5000] rounded-xl">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Register New Hoist</h1>
          <p className="text-xs text-gray-500">Add a new elevator to your fleet database.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <p className="text-sm text-gray-600">Hoist registration form fields go here...</p>
      </div>
    </div>
  );
}
