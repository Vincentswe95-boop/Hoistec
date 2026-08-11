// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Wrench, Building2, Shield, Calendar, Clock } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('renta_user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    try {
      const userRecord = JSON.parse(userStr);
      setUser(userRecord);
    } catch (err) {
      console.error('Failed to parse user session:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('renta_user');
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs text-gray-400 font-medium">
        Loading Renta Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Bar */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FE5000] font-extrabold flex items-center justify-center text-lg shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Welcome back, {user?.name || 'User'}!</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#FE5000]" /> Role: <strong className="uppercase text-gray-700">{user?.role}</strong>
                </span>
                <span>•</span>
                <span>{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => router.push('/users')}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => router.push('/reports')}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Reports
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Quick Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FE5000] flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Hoist Status</h3>
            <p className="text-xs text-gray-500 font-medium">Monitor active construction hoists, service logs, and maintenance intervals.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Customer Portals</h3>
            <p className="text-xs text-gray-500 font-medium">View company bindings, site addresses, and dedicated customer equipment.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Service & Repairs</h3>
            <p className="text-xs text-gray-500 font-medium">Log technician hours, repair notes, parts replaced, and billing summaries.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
