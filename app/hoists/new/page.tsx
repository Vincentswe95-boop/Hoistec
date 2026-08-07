// app/hoists/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Building2, ArrowLeft, Save } from 'lucide-react';
import { useHoists } from '@/context/HoistsContext';
import { useCustomers } from '@/context/CustomersContext';
import dynamic from 'next/dynamic';

// Safely import the MapPicker so Next.js doesn't crash on the server
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full bg-gray-50 border border-gray-200 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm font-medium">
      Loading satellite map...
    </div>
  )
});

export default function NewHoistPage() {
  const router = useRouter();
  const { addHoist } = useHoists();
  const { customers } = useCustomers();

  // Simulating current user role. Pull from your actual Auth/Role state context.
  const [currentUserRole] = useState<'admin' | 'customer' | 'technician'>('admin');

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    model: '',
    serialNumber: '',
    individualNumber: '',
    status: 'In Warehouse',
    currentSite: '',
    customerId: '',
    windSpeedLimit: 12, // Default safe limit
    latitude: '',
    longitude: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call the context function and cast as any to keep TS happy!
      await addHoist({
        ...formData,
        windSpeedLimit: Number(formData.windSpeedLimit),
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
      } as any);
      
      // Redirect back to the fleet list
      router.push('/hoists');
    } catch (error) {
      console.error('Failed to create hoist:', error);
      alert('Failed to create hoist. Please try again.');
      setIsSubmitting(false);
    }
  };

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
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 text-[#FE5000] rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Register New Hoist</h1>
            <p className="text-xs text-gray-500">Add a new elevator to your fleet database.</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/hoists')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Base Information */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Hoist Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Model Name *</label>
                <input required type="text" name="model" value={formData.model} onChange={handleChange} placeholder="e.g., GEDA 500 Z/ZP" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Serial Number *</label>
                <input required type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="e.g., 5564005241" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Individual/Internal Number</label>
                <input type="text" name="individualNumber" value={formData.individualNumber} onChange={handleChange} placeholder="e.g., H-01" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Wind Speed Limit (m/s) *</label>
                <input required type="number" step="0.1" name="windSpeedLimit" value={formData.windSpeedLimit} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]" />
              </div>
            </div>
          </div>

          {/* Deployment & Site Info */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Deployment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]">
                  <option value="In Warehouse">In Warehouse</option>
                  <option value="On Site">On Site</option>
                  <option value="In Maintenance">In Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Customer</label>
                <select name="customerId" value={formData.customerId} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]">
                  <option value="">-- No Customer Assigned --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Site / Area Name</label>
                <input type="text" name="currentSite" value={formData.currentSite} onChange={handleChange} placeholder="e.g., CSP-03 North Tower" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]" />
              </div>
            </div>
          </div>

          {/* Location Coordinates & Map Integration */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex justify-between items-end border-b pb-2">
              <h3 className="text-sm font-bold text-gray-900">Map Coordinates (For Live Wind Data)</h3>
              <span className="text-[10px] text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded">Crucial for Wind Alerts</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Latitude</label>
                <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="e.g., 65.8258" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Longitude</label>
                <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="e.g., 21.6887" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]" />
              </div>
            </div>

            {/* Dynamic Map Picker Integration */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Pinpoint Location on Map</label>
              <MapPicker 
                initialLocation={{ 
                  lat: formData.latitude ? Number(formData.latitude) : 65.8258, 
                  lng: formData.longitude ? Number(formData.longitude) : 21.6887 
                }} 
                onLocationChange={(lat, lng) => {
                  setFormData(prev => ({
                    ...prev,
                    latitude: String(lat),
                    longitude: String(lng)
                  }));
                }}
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FE5000] text-white font-medium text-sm rounded-xl hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save New Hoist</>}
          </button>
        </div>
      </form>
    </div>
  );
}