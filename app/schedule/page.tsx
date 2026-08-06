// app/schedule/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Search, Plus, Trash2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
);

interface RepairTask {
  id: string;
  repairNo: string;
  date: string;
  hoist: string;
  type: string;
  description: string;
  technician: string;
  hours: string;
  status: string;
}

export default function ScheduleRepairsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const [tasks, setTasks] = useState<RepairTask[]>([
    {
      id: '1',
      repairNo: '2026-155294',
      date: '2026-08-06',
      hoist: '5564005241',
      type: 'Service',
      description: 'asdasd',
      technician: 'asdasd',
      hours: '0h',
      status: 'Scheduled'
    }
  ]);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = 
      t.repairNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.technician.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.hoist.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'All Types' || t.type === typeFilter;
    const matchesStatus = statusFilter === 'All Statuses' || t.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) return;
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule & Repairs</h1>
          <p className="text-xs text-gray-500">{tasks.length} tasks and repair orders found</p>
        </div>
        <button
          onClick={() => router.push('/schedule/edit/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FE5000] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Schedule Task
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repair no, description or technician..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#FE5000]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:border-[#FE5000]"
        >
          <option value="All Types">All Types</option>
          <option value="Service">Service</option>
          <option value="Repair">Repair</option>
          <option value="Inspection">Inspection</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:border-[#FE5000]"
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
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Repair No.</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Hoist</th>
                <th className="py-4 px-4">Type</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-4">Technician</th>
                <th className="py-4 px-4">Hours</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No repair tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr 
                    key={t.id} 
                    onClick={() => router.push(`/schedule/edit/${t.repairNo}`)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-bold text-[#FE5000] hover:underline">
                      {t.repairNo}
                    </td>
                    <td className="py-4 px-4 text-gray-600">{t.date}</td>
                    <td className="py-4 px-4 font-mono font-medium text-gray-800">{t.hoist}</td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-md">
                        {t.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-700 max-w-xs truncate">{t.description}</td>
                    <td className="py-4 px-4 font-semibold text-gray-900">{t.technician || 'Unassigned'}</td>
                    <td className="py-4 px-4 text-gray-600">{t.hours}</td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px]">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/schedule/edit/${t.repairNo}`);
                        }}
                        className="text-[#FE5000] font-bold hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => handleDeleteTask(t.id, e)}
                        className="text-red-500 font-semibold hover:underline"
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
