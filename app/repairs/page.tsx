// app/repairs/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RepairItem {
  id: number;
  repair_no: string;
  hoist_id: number;
  date: string;
  type: string;
  description: string | null;
  technician: string | null;
  hours: number;
  parts: string | null;
  status: string;
}

export default function RepairsPage() {
  const router = useRouter();
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchRepairs();
  }, []);

  async function fetchRepairs() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('repairs')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching repairs:', error.message);
      } else {
        setRepairs(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: number, repairNo: string) => {
    if (!confirm(`Are you sure you want to delete repair task ${repairNo}?`)) return;

    setRepairs((prev) => prev.filter((item) => item.id !== id));
    setSuccessMessage(`Repair ${repairNo} deleted successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);

    try {
      const { error } = await supabase
        .from('repairs')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`Failed to delete from Supabase: ${error.message}`);
        fetchRefreshedData();
      }
    } catch (err) {
      console.error('Delete execution error:', err);
      fetchRefreshedData();
    }
  };

  async function fetchRefreshedData() {
    const { data } = await supabase.from('repairs').select('*').order('id', { ascending: false });
    if (data) setRepairs(data);
  }

  const filteredRepairs = repairs.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch =
      item.repair_no.toLowerCase().includes(searchLower) ||
      (item.description || '').toLowerCase().includes(searchLower) ||
      (item.technician || '').toLowerCase().includes(searchLower) ||
      String(item.hoist_id).includes(searchLower);

    const matchType = selectedType === 'All Types' || item.type === selectedType;
    const matchStatus = selectedStatus === 'All Statuses' || item.status === selectedStatus;

    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule & Repairs</h1>
          <p className="text-xs text-gray-500">{filteredRepairs.length} tasks and repair orders found</p>
        </div>
        <button
          onClick={() => router.push('/repairs/new')}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FE5000] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Schedule Task
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMessage}
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search repair no, description or technician..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000]"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000] w-full md:w-48"
        >
          <option value="All Types">All Types</option>
          <option value="Service">Service</option>
          <option value="Repair">Repair</option>
          <option value="Inspection">Inspection</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000] w-full md:w-48"
        >
          <option value="All Statuses">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Repairs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Repair No.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Hoist ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400 font-medium">
                    {isLoading ? 'Loading repair tasks...' : 'No repair tasks found.'}
                  </td>
                </tr>
              ) : (
                filteredRepairs.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      <button
                        onClick={() => router.push(`/repairs/${item.id}`)}
                        className="text-[#FE5000] hover:underline cursor-pointer bg-transparent border-0 p-0 font-bold text-left"
                      >
                        {item.repair_no}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">{item.date}</td>
                    <td className="py-3.5 px-4 text-gray-800 font-semibold">{item.hoist_id}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-lg text-[10px]">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 truncate max-w-xs">{item.description || '-'}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">{item.technician || 'Unassigned'}</td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">{item.hours}h</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 font-semibold rounded-lg text-[10px] ${
                        item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                        item.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-3 font-semibold">
                      <button
                        onClick={() => router.push(`/repairs/${item.id}`)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.repair_no)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
