'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import { useHoists, Hoist } from '@/context/HoistsContext';
import { useCustomers } from '@/context/CustomersContext';

export default function HoistsPage() {
  const { hoists, addHoist, updateHoist, deleteHoist } = useHoists();
  const { customers } = useCustomers();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Hoist['status']>('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHoist, setEditingHoist] = useState<Hoist | null>(null);

  const [hoistForm, setHoistForm] = useState({
    serialNumber: '',
    individualNumber: '',
    model: '',
    manufacturer: '',
    status: 'On Site' as Hoist['status'],
    currentSite: '',
    windSpeedLimit: 15,
    customerId: null as number | null,
  });

  // === FILTERED HOISTS ===
  const filteredHoists = hoists.filter((hoist) => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      hoist.serialNumber.toLowerCase().includes(searchLower) ||
      (hoist.individualNumber || '').toLowerCase().includes(searchLower) ||
      hoist.model.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'All' || hoist.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors: any = {
    'On Site': 'bg-green-100 text-green-700',
    'Off Site': 'bg-gray-100 text-gray-700',
    Assembling: 'bg-blue-100 text-blue-700',
    Disassembling: 'bg-orange-100 text-orange-700',
    Stopped: 'bg-yellow-100 text-yellow-700',
    Fault: 'bg-red-100 text-red-700',
  };

  // === Handlers ===
  const openAddModal = () => {
    setHoistForm({
      serialNumber: '',
      individualNumber: '',
      model: '',
      manufacturer: '',
      status: 'On Site',
      currentSite: '',
      windSpeedLimit: 15,
      customerId: null,
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => setIsAddModalOpen(false);

  const openEditModal = (hoist: Hoist) => {
    setEditingHoist(hoist);
    setHoistForm({
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

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingHoist(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setHoistForm(prev => ({
      ...prev,
      [name]: name === 'windSpeedLimit' || name === 'customerId'
        ? (value === '' ? null : parseInt(value))
        : value,
    }));
  };

  const handleSubmitAdd = () => {
    if (!hoistForm.serialNumber || !hoistForm.model) {
      alert("Please fill in Serial Number and Model");
      return;
    }
    addHoist(hoistForm);
    closeAddModal();
  };

  const handleSubmitEdit = () => {
    if (!editingHoist) return;
    updateHoist(editingHoist.id, hoistForm);
    closeEditModal();
  };

  const handleDelete = (id: number, serial: string) => {
    if (confirm(`Delete hoist ${serial}?`)) {
      deleteHoist(id);
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold">Hoists</h1>
              <p className="text-gray-500 mt-1">{filteredHoists.length} hoists</p>
            </div>
            <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Hoist
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by serial, individual number or model..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-xl px-4 py-3"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="All">All Statuses</option>
              <option value="On Site">On Site</option>
              <option value="Off Site">Off Site</option>
              <option value="Assembling">Assembling</option>
              <option value="Disassembling">Disassembling</option>
              <option value="Stopped">Stopped</option>
              <option value="Fault">Fault</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Serial No.</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Individual No.</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Model</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Current Site</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Customer</th>
                  <th className="w-24 px-6 py-4 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredHoists.length > 0 ? (
                  filteredHoists.map((hoist) => {
                    const customer = hoist.customerId ? customers.find(c => c.id === hoist.customerId) : null;
                    return (
                      <tr key={hoist.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono font-semibold text-[#FE5000]">
                          <Link href={`/hoists/${hoist.id}`} className="hover:underline">
                            {hoist.serialNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{hoist.individualNumber || '-'}</td>
                        <td className="px-6 py-4">{hoist.model}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[hoist.status]}`}>
                            {hoist.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{hoist.currentSite}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {customer ? customer.name : <span className="text-gray-400">Not assigned</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditModal(hoist)} className="p-2 text-gray-500 hover:text-[#FE5000] hover:bg-orange-50 rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(hoist.id, hoist.serialNumber)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No hoists found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal + Edit Modal (kept short for now) */}
      {/* You can keep your existing modals here */}
    </div>
  );
}