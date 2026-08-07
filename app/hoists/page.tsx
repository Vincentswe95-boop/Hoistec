// app/hoists/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Trash2, Building2 } from 'lucide-react';
import { useHoists } from '@/context/HoistsContext';
import { useCustomers } from '@/context/CustomersContext';

export default function HoistsPage() {
  const { hoists, deleteHoist } = useHoists();
  const { customers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Safely filter hoists with optional chaining to prevent crashes on bad data
  const safeHoists = hoists || [];
  const filteredHoists = safeHoists.filter((hoist) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (hoist.serialNumber?.toLowerCase() || '').includes(searchLower) ||
      (hoist.individualNumber?.toLowerCase() || '').includes(searchLower) ||
      (hoist.model?.toLowerCase() || '').includes(searchLower);
    
    const matchesStatus = statusFilter === 'All' || (hoist.status as string) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hoists Fleet</h1>
          <p className="text-sm text-gray-500">{safeHoists.length} total hoists registered in the system</p>
        </div>
        <Link 
          href="/hoists/new" 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FE5000] text-white font-medium text-sm rounded-xl hover:bg-orange-600 transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4" /> Add Hoist
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                    <tr key={hoist.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="py-4 px-6 font-mono font-semibold text-[#FE5000]">
                        <Link href={`/hoists/${hoist.id}`} className="hover:underline">
                          {hoist.serialNumber || 'UNKNOWN'}
                        </Link>
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-600">{hoist.individualNumber || '—'}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">{hoist.model || '—'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${
                          statusStr === 'On Site' ? 'bg-emerald-100 text-emerald-700' :
                          statusStr === 'In Warehouse' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            statusStr === 'On Site' ? 'bg-emerald-500' :
                            statusStr === 'In Warehouse' ? 'bg-blue-500' : 'bg-amber-500'
                          }`}></span>
                          {hoist.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {hoist.currentSite ? (
                          <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-gray-400"/> {hoist.currentSite}</span>
                        ) : '—'}
                      </td>
                      <td className="py-4 px-6 text-gray-600">{customer ? customer.name : '—'}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/hoists/${hoist.id}`} 
                            className="p-1.5 text-gray-400 hover:text-[#FE5000] hover:bg-orange-50 rounded-lg transition-colors"
                            title="View Hoist"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => { if(confirm(`Are you sure you want to delete hoist ${hoist.serialNumber}?`)) deleteHoist(hoist.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Hoist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No hoists found matching your criteria.</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                        className="text-[#FE5000] text-xs font-semibold hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
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