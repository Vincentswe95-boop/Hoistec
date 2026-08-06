// app/hoists/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Truck, MapPin } from 'lucide-react';
import { useHoists } from '@/context/HoistsContext';
import { useCustomers } from '@/context/CustomersContext';

export default function HoistsPage() {
  const { hoists, deleteHoist } = useHoists();
  const { customers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredHoists = hoists.filter((hoist) => {
    const matchesSearch = 
      hoist.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hoist.individualNumber && hoist.individualNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (hoist.model && hoist.model.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || (hoist.status as string) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hoists</h1>
          <p className="text-sm text-gray-500">{hoists.length} total hoists registered</p>
        </div>
        <Link 
          href="/hoists/new" 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FE5000] text-white font-medium text-sm rounded-xl hover:bg-orange-600 transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4" /> Add Hoist
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="card flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by serial, individual number or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000] w-full md:w-48"
        >
          <option value="All">All Statuses</option>
          <option value="On Site">On Site</option>
          <option value="In Warehouse">In Warehouse</option>
          <option value="In Maintenance">In Maintenance</option>
        </select>
      </div>

      {/* Hoists Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Serial No.</th>
                <th className="py-4 px-6">Individual No.</th>
                <th className="py-4 px-6">Model</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Current Site</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredHoists.length > 0 ? (
                filteredHoists.map((hoist) => {
                  const customer = customers.find(c => hoist.customerId != null && String(c.id) === String(hoist.customerId));
                  const statusStr = hoist.status as string;
                  return (
                    <tr key={hoist.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-semibold text-[#FE5000]">
                        <Link href={`/hoists/${hoist.id}`} className="hover:underline">
                          {hoist.serialNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-600">{hoist.individualNumber || '—'}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">{hoist.model || '—'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${
                          statusStr === 'On Site' ? 'bg-green-100 text-green-700' :
                          statusStr === 'In Warehouse' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            statusStr === 'On Site' ? 'bg-green-500' :
                            statusStr === 'In Warehouse' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}></span>
                          {hoist.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{hoist.currentSite || '—'}</td>
                      <td className="py-4 px-6 text-gray-600">{customer ? customer.name : '—'}</td>
                      <td className="py-4 px-6 text-right space-x-3">
                        <Link href={`/hoists/${hoist.id}`} className="text-gray-600 hover:text-[#FE5000] font-medium text-xs">
                          View
                        </Link>
                        <button 
                          onClick={() => { if(confirm('Are you sure you want to delete this hoist?')) deleteHoist(hoist.id); }}
                          className="text-red-500 hover:text-red-700 font-medium text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No hoists found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
