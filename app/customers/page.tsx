'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { useCustomers } from '@/context/CustomersContext';
import { useHoists } from '@/context/HoistsContext';
import { useUser } from '@/context/UserContext'; // Ensure this path matches your project

export default function CustomersPage() {
  const { user } = useUser();
  const router = useRouter();
  const { customers, deleteCustomer } = useCustomers();
  const { hoists } = useHoists();
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Guard Logic: Redirect if role is customer
  useEffect(() => {
    if (user && user.role === 'customer') {
      router.push('/');
    }
  }, [user, router]);

  // 2. Prevent rendering until we know the role
  if (!user || user.role === 'customer') {
    return null;
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} registered client accounts</p>
        </div>
        <Link 
          href="/customers/new" 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FE5000] text-white font-medium text-sm rounded-xl hover:bg-orange-600 transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </Link>
      </div>

      <div className="card">
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Customer Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Phone</th>
                <th className="py-4 px-6">Assigned Hoists</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                  const customerHoistsCount = hoists.filter(h => String(h.customerId) === String(customer.id)).length;
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-100 text-[#FE5000] rounded-xl flex items-center justify-center font-bold text-sm">
                          {customer.name.charAt(0)}
                        </div>
                        {customer.name}
                      </td>
                      <td className="py-4 px-6 text-gray-600">{customer.email || '—'}</td>
                      <td className="py-4 px-6 text-gray-600">{customer.phone || '—'}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-orange-50 text-[#FE5000]">
                          {customerHoistsCount} hoists
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-3">
                        <Link href={`/customers/${customer.id}`} className="text-gray-600 hover:text-[#FE5000] font-medium text-xs">
                          View
                        </Link>
                        <button
                          onClick={() => { if(confirm('Delete this customer?')) deleteCustomer(customer.id); }}
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
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No customers found.
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