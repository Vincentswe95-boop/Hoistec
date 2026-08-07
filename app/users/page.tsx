// app/users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Trash2, Shield, Mail, Phone, X, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UserManagementPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New user form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'technician',
    customer_id: '',
  });

  // Route protection and data fetching
  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) {
          router.push('/login');
          return;
        }

        // Check user role
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (userError || userRecord?.role === 'customer') {
          router.push('/');
          return;
        }

        setIsAuthorized(true);
        fetchUsers();
        fetchCustomers();
      } catch (err) {
        console.error('Authorization check failed:', err);
        router.push('/');
      }
    };

    verifyAndLoad();
  }, [router]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').order('id', { ascending: true });
      if (error) throw error;
      if (data) setUsers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      if (data) setCustomers(data);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        customer_id: formData.role === 'customer' && formData.customer_id ? Number(formData.customer_id) : null,
      };

      const { error } = await supabase.from('users').insert([payload]);
      if (error) throw error;

      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'technician', customer_id: '' });
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user');
    }
  };

  // Helper to find customer company name
  const getCustomerName = (customerId: number) => {
    const found = customers.find(c => Number(c.id) === Number(customerId));
    return found ? found.name : `Customer ID #${customerId}`;
  };

  // Prevent flash while verifying authorization
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-xs text-gray-500 font-medium">Manage system users, permissions, and customer bindings</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FE5000] hover:bg-orange-600 text-white font-bold rounded-2xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 font-medium">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-medium">No users found in the database.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="p-5">User</th>
                <th className="p-5">Email</th>
                <th className="p-5">Phone</th>
                <th className="p-5">Role & Company Link</th>
                <th className="p-5">Created At</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-[#FE5000] font-bold flex items-center justify-center text-sm shadow-xs">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{u.name || 'Unnamed User'}</div>
                      <div className="text-gray-400 text-[10px]">ID: #{u.id}</div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> {u.email}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {u.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="p-5 space-y-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-xs ${
                      u.role === 'admin' 
                        ? 'bg-orange-100 text-[#FE5000]' 
                        : u.role === 'customer' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      <Shield className="w-3 h-3" /> {u.role || 'technician'}
                    </span>
                    {u.role === 'customer' && u.customer_id && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-600 font-bold">
                        <Building2 className="w-3.5 h-3.5 text-[#FE5000]" />
                        {getCustomerName(u.customer_id)}
                      </div>
                    )}
                  </td>
                  <td className="p-5 text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-5 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-[#FE5000] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="user@renta.se"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-[#FE5000] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-[#FE5000] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+46..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-[#FE5000] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-[#FE5000] focus:bg-white"
                >
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              {formData.role === 'customer' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Assign Customer Company</label>
                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleInputChange}
                    required={formData.role === 'customer'}
                    className="w-full px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl font-medium text-orange-900 outline-none focus:border-[#FE5000]"
                  >
                    <option value="">-- Select Customer Company --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.address || 'No address'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">This user will only see hoists assigned to this company.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FE5000] hover:bg-orange-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}