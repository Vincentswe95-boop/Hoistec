// app/customers/[id]/page.tsx
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Trash2 } from 'lucide-react';
import { useCustomers } from '@/context/CustomersContext';
import { useHoists } from '@/context/HoistsContext';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  if (resolvedParams.id === 'new') {
    return null; // Prevents flash while Next.js routes to the new page
  }

  const { customers, deleteCustomer } = useCustomers();
  const { hoists } = useHoists();

  const customer = customers.find(c => String(c.id) === String(resolvedParams.id));
  const customerHoists = hoists.filter(h => String(h.customerId) === String(resolvedParams.id));

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Customer not found</h2>
        <Link href="/customers" className="text-[#FE5000] hover:underline text-sm font-medium">
          &larr; Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500">Customer Account Details</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this customer?')) {
              deleteCustomer(customer.id);
              router.push('/customers');
            }
          }}
          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Delete Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card space-y-4 md:col-span-1">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Contact Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{customer.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{customer.phone || 'No phone provided'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{customer.address || 'No address provided'}</span>
            </div>
          </div>
        </div>

        <div className="card md:col-span-2 space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Assigned Hoists ({customerHoists.length})</h3>
          {customerHoists.length > 0 ? (
            <div className="divide-y">
              {customerHoists.map(hoist => (
                <div key={hoist.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link href={`/hoists/${hoist.id}`} className="font-mono font-bold text-[#FE5000] hover:underline">
                      {hoist.serialNumber}
                    </Link>
                    <p className="text-xs text-gray-500">Model: {hoist.model || '—'} | Site: {hoist.currentSite || '—'}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    {hoist.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4">No hoists currently assigned to this customer.</p>
          )}
        </div>
      </div>
    </div>
  );
}
