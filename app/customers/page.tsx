'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import { useCustomers, Customer } from '@/context/CustomersContext';
import { useHoists } from '@/context/HoistsContext';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { getHoistsByCustomer } = useHoists();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === Address Autocomplete Logic ===
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=fi,se`,
        { headers: { 'User-Agent': 'Hoistec/1.0' } }
      );
      const data = await res.json();
      setAddressSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search failed:', error);
      setAddressSuggestions([]);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerForm(prev => ({ ...prev, address: value }));

    // Debounce the search
    if (addressSearchTimeout) clearTimeout(addressSearchTimeout);

    const timeout = setTimeout(() => {
      searchAddress(value);
    }, 400);

    setAddressSearchTimeout(timeout);
  };

  const selectAddressSuggestion = (suggestion: AddressSuggestion) => {
    setCustomerForm(prev => ({ ...prev, address: suggestion.display_name }));
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // === Create Modal ===
  const openCreateModal = () => {
    setCustomerForm({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    });
    setAddressSuggestions([]);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setAddressSuggestions([]);
  };

  // === Edit Modal ===
  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      contactPerson: customer.contactPerson,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes || '',
    });
    setAddressSuggestions([]);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    setAddressSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitCreate = () => {
    if (!customerForm.name || !customerForm.contactPerson) {
      alert("Please fill in Company Name and Contact Person");
      return;
    }
    addCustomer(customerForm);
    closeCreateModal();
  };

  const handleSubmitEdit = () => {
    if (!editingCustomer) return;
    updateCustomer(editingCustomer.id, customerForm);
    closeEditModal();
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete customer "${name}"?`)) {
      deleteCustomer(id);
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
          <Link href="/hoists" className="sidebar-link">Hoists</Link>
          <Link href="/repairs" className="sidebar-link">Schedule & Repairs</Link>
          <Link href="/reports" className="sidebar-link">Reports</Link>
          <Link href="/customers" className="sidebar-link active">Customers</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold">Customers</h1>
              <p className="text-gray-500 mt-1">{filteredCustomers.length} customers</p>
            </div>
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by company name, contact person or email..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Company Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Contact Person</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Address</th>
                  <th className="w-24 px-6 py-4 text-center text-sm font-medium text-gray-600">Hoists</th>
                  <th className="w-24 px-6 py-4 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const hoistCount = getHoistsByCustomer(customer.id).length;
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold">{customer.name}</td>
                        <td className="px-6 py-4 text-gray-700">{customer.contactPerson}</td>
                        <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                        <td className="px-6 py-4 text-gray-600">{customer.phone}</td>
                        <td className="px-6 py-4 text-gray-600 max-w-[280px] truncate">{customer.address}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            {hoistCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditModal(customer)} className="p-2 text-gray-500 hover:text-[#FE5000] hover:bg-orange-50 rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(customer.id, customer.name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
                      No customers found. Click "Add Customer" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== CREATE CUSTOMER MODAL ==================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Add New Customer</h2>
              <button onClick={closeCreateModal}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Company Name *</label>
                <input name="name" value={customerForm.name} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Contact Person *</label>
                <input name="contactPerson" value={customerForm.contactPerson} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Email</label>
                  <input name="email" type="email" value={customerForm.email} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Phone</label>
                  <input name="phone" value={customerForm.phone} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
              </div>

              {/* Address with Autocomplete */}
              <div className="relative">
                <label className="text-sm text-gray-600 block mb-1">Address</label>
                <input
                  name="address"
                  value={customerForm.address}
                  onChange={handleAddressChange}
                  onFocus={() => customerForm.address.length > 2 && setShowSuggestions(true)}
                  className="w-full border rounded-lg px-4 py-2.5"
                  placeholder="Start typing address..."
                  autoComplete="off"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectAddressSuggestion(suggestion)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0"
                      >
                        {suggestion.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Notes</label>
                <textarea name="notes" value={customerForm.notes} onChange={handleInputChange} rows={3} className="w-full border rounded-lg px-4 py-2.5" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={closeCreateModal} className="px-6 py-2.5 border border-gray-300 rounded-xl">Cancel</button>
              <button onClick={handleSubmitCreate} className="btn-primary px-8">Add Customer</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT CUSTOMER MODAL ==================== */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Edit Customer</h2>
              <button onClick={closeEditModal}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Company Name *</label>
                <input name="name" value={customerForm.name} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Contact Person *</label>
                <input name="contactPerson" value={customerForm.contactPerson} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Email</label>
                  <input name="email" type="email" value={customerForm.email} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Phone</label>
                  <input name="phone" value={customerForm.phone} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
              </div>

              {/* Address with Autocomplete */}
              <div className="relative">
                <label className="text-sm text-gray-600 block mb-1">Address</label>
                <input
                  name="address"
                  value={customerForm.address}
                  onChange={handleAddressChange}
                  onFocus={() => customerForm.address.length > 2 && setShowSuggestions(true)}
                  className="w-full border rounded-lg px-4 py-2.5"
                  placeholder="Start typing address..."
                  autoComplete="off"
                />
                
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectAddressSuggestion(suggestion)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0"
                      >
                        {suggestion.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Notes</label>
                <textarea name="notes" value={customerForm.notes} onChange={handleInputChange} rows={3} className="w-full border rounded-lg px-4 py-2.5" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={closeEditModal} className="px-6 py-2.5 border border-gray-300 rounded-xl">Cancel</button>
              <button onClick={handleSubmitEdit} className="btn-primary px-8">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
