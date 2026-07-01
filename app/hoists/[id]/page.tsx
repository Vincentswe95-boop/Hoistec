'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Calendar, Save, Wind, MapPin, RefreshCw } from 'lucide-react';
import { useHoists } from '@/context/HoistsContext';
import { useRepairs } from '@/context/RepairsContext';
import { useCustomers } from '@/context/CustomersContext';
import MapPicker from '@/components/MapPicker';

interface HoistProfileProps {
  params: Promise<{ id: string }>;
}

export default function HoistProfile({ params }: HoistProfileProps) {
  const { id } = React.use(params);
  const hoistId = parseInt(id);

  const { hoists, updateHoist, deleteHoist, getHoistById } = useHoists();
  const { getRepairsByHoist } = useRepairs();
  const { customers, getCustomerById } = useCustomers();
  const router = useRouter();

  const hoist = getHoistById(hoistId);
  const repairs = getRepairsByHoist(hoistId);
  const currentCustomer = hoist?.customerId ? getCustomerById(hoist.customerId) : null;

  // === State ===
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | undefined>(hoist?.location);
  const [pendingWindLimit, setPendingWindLimit] = useState(hoist?.windSpeedLimit || 15);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // === Robust initial location (Customer address geocoding) ===
  const geocodeCustomerAddress = async () => {
    if (!currentCustomer?.address) return;

    setIsGeocoding(true);
    try {
      const query = encodeURIComponent(currentCustomer.address);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        { headers: { 'User-Agent': 'Hoistec/1.0' } }
      );
      const data = await res.json();

      if (data.length > 0) {
        const newLoc = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setPendingLocation(newLoc);
        setHasUnsavedChanges(true);
      } else {
        alert("Could not find coordinates for this address. Please place the pin manually.");
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      alert("Failed to load location from address. Please place the pin manually on the map.");
    }
    setIsGeocoding(false);
  };

  // Run on initial load / when hoist or customer changes
  useEffect(() => {
    if (!hoist) return;

    // Priority 1: Use already saved location
    if (hoist.location) {
      setPendingLocation(hoist.location);
      return;
    }

    // Priority 2: Geocode from customer address
    if (currentCustomer?.address) {
      geocodeCustomerAddress();
    } else {
      // Fallback to Helsinki only if nothing else is available
      setPendingLocation({ lat: 60.1699, lng: 24.9384 });
    }
  }, [hoist?.id, currentCustomer?.id]);

  if (!hoist) return <div className="p-8">Hoist not found</div>;

  // === Handlers ===
  const handleLocationChange = (lat: number, lng: number) => {
    setPendingLocation({ lat, lng });
    setHasUnsavedChanges(true);
  };

  const handleWindLimitChange = (newLimit: number) => {
    setPendingWindLimit(newLimit);
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    if (!pendingLocation) return;

    updateHoist(hoistId, {
      location: pendingLocation,
      windSpeedLimit: pendingWindLimit,
    });
    setHasUnsavedChanges(false);
    alert("Location and Wind Speed settings saved successfully!");
  };

  // Edit Modal
  const openEditModal = () => {
    setEditForm({
      serialNumber: hoist.serialNumber,
      individualNumber: hoist.individualNumber || '',
      model: hoist.model,
      manufacturer: hoist.manufacturer,
      status: hoist.status,
      currentSite: hoist.currentSite,
      windSpeedLimit: hoist.windSpeedLimit || 15,
      customerId: hoist.customerId ?? null,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => setIsEditModalOpen(false);

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({
      ...prev,
      [name]: name === 'windSpeedLimit' || name === 'customerId'
        ? (value === '' ? null : parseInt(value))
        : value,
    }));
  };

  const handleSaveEdit = () => {
    updateHoist(hoistId, {
      ...editForm,
      customerId: editForm.customerId || null,
    });
    closeEditModal();
    alert("Hoist updated successfully!");
  };

  const handleDelete = () => {
    if (confirm(`Delete hoist ${hoist.serialNumber}?`)) {
      deleteHoist(hoistId);
      router.push('/hoists');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FE5000] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <h1 className="text-xl font-bold">Hoistec</h1>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link href="/" className="sidebar-link">Dashboard</Link>
          <Link href="/hoists" className="sidebar-link active">Hoists</Link>
          <Link href="/repairs" className="sidebar-link">Schedule & Repairs</Link>
          <Link href="/reports" className="sidebar-link">Reports</Link>
          <Link href="/customers" className="sidebar-link">Customers</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/hoists" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" /> Back to Hoists
              </Link>
              <div>
                <h1 className="text-3xl font-semibold">{hoist.serialNumber}</h1>
                <p className="text-gray-500">{hoist.model} • {hoist.manufacturer}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">Unsaved changes</span>
              )}
              <button 
                onClick={handleSaveChanges} 
                disabled={!hasUnsavedChanges || !pendingLocation}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <button onClick={openEditModal} className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button onClick={handleDelete} className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Assigned Customer */}
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-4">Assigned Customer</h3>
                {currentCustomer ? (
                  <div>
                    <p className="font-semibold text-lg">{currentCustomer.name}</p>
                    <p className="text-sm text-gray-600">{currentCustomer.contactPerson}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Not assigned to any customer</p>
                )}
              </div>

              {/* Map with "Use customer address" button */}
              <div className="bg-white rounded-2xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Location on Map
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentCustomer?.address && (
                      <button
                        onClick={geocodeCustomerAddress}
                        disabled={isGeocoding}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGeocoding ? 'animate-spin' : ''}`} />
                        Use customer address
                      </button>
                    )}
                    <p className="text-xs text-gray-500">Click map to place pin • Then Save</p>
                  </div>
                </div>

                {isGeocoding ? (
                  <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl">
                    <p className="text-gray-500">Loading location from customer address...</p>
                  </div>
                ) : (
                  <MapPicker 
  key={hoistId}                    // Important for remounting when hoist changes
  initialLocation={pendingLocation} 
  onLocationChange={handleLocationChange}
/>
                )}

                {pendingLocation && (
                  <p className="text-xs text-gray-500 mt-2">
                    Lat: {pendingLocation.lat.toFixed(5)} &nbsp; Lng: {pendingLocation.lng.toFixed(5)}
                  </p>
                )}

                {currentCustomer?.address && (
                  <p className="text-xs text-gray-500 mt-1">
                    Based on customer address: <span className="font-medium text-gray-700">{currentCustomer.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Wind className="w-5 h-5" /> Wind Speed Warning
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <input 
                    type="range" 
                    min="5" 
                    max="25" 
                    step="1"
                    value={pendingWindLimit}
                    onChange={(e) => handleWindLimitChange(parseInt(e.target.value))}
                    className="flex-1 accent-[#FE5000]"
                  />
                  <div className="w-16 text-right font-mono text-2xl font-semibold">
                    {pendingWindLimit} <span className="text-sm">m/s</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Warning triggers when gust wind exceeds this limit.</p>
              </div>

              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <button onClick={() => setIsScheduleModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#FE5000] text-white px-6 py-3 rounded-xl hover:bg-[#e64500]">
                  <Calendar className="w-4 h-4" /> Schedule Repair
                </button>
              </div>
            </div>
          </div>

          {/* Recent Repairs */}
          <div className="mt-8 bg-white rounded-2xl border p-6">
            <h3 className="font-semibold mb-4">Recent Repairs</h3>
            {repairs.length > 0 ? (
              <div className="space-y-3">
                {repairs.slice(0, 5).map(repair => (
                  <div key={repair.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <span className="font-mono text-sm text-[#FE5000]">{repair.repairNo}</span>
                      <span className="ml-3 text-gray-700">{repair.description}</span>
                    </div>
                    <div className="text-sm text-gray-500">{repair.date} • {repair.technician}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No repairs recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Edit Hoist</h2>
              <button onClick={closeEditModal}><Edit2 className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Serial Number</label>
                  <input name="serialNumber" value={editForm.serialNumber} onChange={handleEditInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Individual Number</label>
                  <input name="individualNumber" value={editForm.individualNumber} onChange={handleEditInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Model</label>
                  <input name="model" value={editForm.model} onChange={handleEditInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Manufacturer</label>
                  <input name="manufacturer" value={editForm.manufacturer} onChange={handleEditInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Current Site</label>
                <input name="currentSite" value={editForm.currentSite} onChange={handleEditInputChange} className="w-full border rounded-lg px-4 py-2.5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Status</label>
                  <select name="status" value={editForm.status} onChange={handleEditInputChange} className="w-full border rounded-lg px-4 py-2.5">
                    <option>On Site</option>
                    <option>Off Site</option>
                    <option>Assembling</option>
                    <option>Disassembling</option>
                    <option>Stopped</option>
                    <option>Fault</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Wind Speed Limit (m/s)</label>
                  <input type="number" name="windSpeedLimit" value={editForm.windSpeedLimit} onChange={handleEditInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Assigned Customer</label>
                <select name="customerId" value={editForm.customerId ?? ''} onChange={handleEditInputChange} className="w-full border rounded-lg px-4 py-2.5">
                  <option value="">— Not assigned —</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.contactPerson})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={closeEditModal} className="px-6 py-2.5 border border-gray-300 rounded-xl">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary px-8">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}