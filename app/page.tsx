'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, Calendar, FileText, Users, AlertTriangle, 
  MapPin, ArrowRight, Plus, X, RefreshCw 
} from 'lucide-react';
import { useHoists } from '@/context/HoistsContext';
import { useRepairs } from '@/context/RepairsContext';
import { useCustomers } from '@/context/CustomersContext';

interface WindAlert {
  hoist: any;
  currentGust: number;
  currentWindSpeed: number;
  limit: number;
  isAlert: boolean;
  error?: boolean;
}

export default function HoistecDashboard() {
  const { hoists } = useHoists();
  const { getAllRepairs } = useRepairs();
  const { customers } = useCustomers();

  const allRepairs = getAllRepairs();

  // === Wind Data State ===
  const [windData, setWindData] = useState<WindAlert[]>([]);
  const [isLoadingWind, setIsLoadingWind] = useState(false);
  const [showWindModal, setShowWindModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // === Stats ===
  const totalHoists = hoists.length;
  const onSiteHoists = hoists.filter(h => h.status === 'On Site').length;
  const upcomingRepairs = allRepairs.filter(r => r.status === 'Scheduled' || r.status === 'In Progress').length;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const repairsThisMonth = allRepairs.filter(r => r.date.startsWith(currentMonth)).length;

  // === Recent Activity ===
  const recentActivity = [...allRepairs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  // === Upcoming Repairs ===
  const upcomingList = [...allRepairs]
    .filter(r => r.status === 'Scheduled' || r.status === 'In Progress')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  // === Fetch Live Wind Gust Data ===
  const fetchWindData = async (showLoading = false) => {
    const relevantHoists = hoists.filter(h => h.status === 'On Site' && h.location);
    if (relevantHoists.length === 0) {
      setWindData([]);
      setLastUpdated(new Date());
      return;
    }

    if (showLoading) setIsLoadingWind(true);

    const promises = relevantHoists.map(async (hoist) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${hoist.location!.lat}&longitude=${hoist.location!.lng}&current=wind_speed_10m,wind_gusts_10m&wind_speed_unit=ms`;
        const res = await fetch(url);
        const data = await res.json();

        const currentGust = data.current?.wind_gusts_10m || 0;
        const currentWindSpeed = data.current?.wind_speed_10m || 0;
        const limit = hoist.windSpeedLimit || 15;

        return {
          hoist,
          currentGust: Math.round(currentGust * 10) / 10,
          currentWindSpeed: Math.round(currentWindSpeed * 10) / 10,
          limit,
          isAlert: currentGust > limit,
        };
      } catch {
        return {
          hoist,
          currentGust: 0,
          currentWindSpeed: 0,
          limit: hoist.windSpeedLimit || 15,
          isAlert: false,
          error: true,
        };
      }
    });

    const results = await Promise.all(promises);
    setWindData(results);
    setLastUpdated(new Date());
    if (showLoading) setIsLoadingWind(false);
  };

  // === Real-time Polling (every 60 seconds) ===
  useEffect(() => {
    fetchWindData(); // Initial fetch

    const interval = setInterval(() => {
      fetchWindData(); // Background refresh (no loading spinner)
    }, 60000); // 60 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [hoists]);

  const activeAlerts = windData.filter(w => w.isAlert);
  const safeCount = windData.length - activeAlerts.length;

  // Format last updated time
  const formattedLastUpdated = lastUpdated 
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  // === Wind Alerts Modal ===
  const WindAlertsModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl">
        <div className="flex items-center justify-between px-8 py-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#FE5000]" />
            <h2 className="text-2xl font-semibold">Wind Alerts (Gust Speed)</h2>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              {activeAlerts.length} Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchWindData(true)} 
              disabled={isLoadingWind}
              className="flex items-center gap-2 px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingWind ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => setShowWindModal(false)}><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-auto">
          {windData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No on-site hoists with location data found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Hoist</th>
                  <th className="text-left py-3 px-4">Site</th>
                  <th className="text-center py-3 px-4">Gust Speed</th>
                  <th className="text-center py-3 px-4">Wind Speed</th>
                  <th className="text-center py-3 px-4">Limit</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {windData.map((item, index) => (
                  <tr key={index} className={item.isAlert ? 'bg-red-50' : ''}>
                    <td className="py-4 px-4 font-mono font-semibold">{item.hoist.serialNumber}</td>
                    <td className="py-4 px-4 text-gray-600">{item.hoist.currentSite}</td>
                    <td className="py-4 px-4 text-center font-mono font-semibold text-[#FE5000]">
                      {item.currentGust} m/s
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-gray-500">
                      {item.currentWindSpeed} m/s
                    </td>
                    <td className="py-4 px-4 text-center font-mono">{item.limit} m/s</td>
                    <td className="py-4 px-4 text-center">
                      {item.error ? (
                        <span className="text-gray-400">No data</span>
                      ) : item.isAlert ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">ALERT</span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Safe</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link 
                        href={`/hoists/${item.hoist.id}`} 
                        className="text-[#FE5000] hover:underline text-sm"
                        onClick={() => setShowWindModal(false)}
                      >
                        View Hoist →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t px-8 py-5 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {formattedLastUpdated && `Last updated: ${formattedLastUpdated}`}
          </div>
          <button onClick={() => setShowWindModal(false)} className="px-6 py-2.5 border rounded-xl">Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FE5000] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hoistec</h1>
              <p className="text-xs text-gray-500">Construction Hoist Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/" className="sidebar-link active">Dashboard</Link>
          <Link href="/hoists" className="sidebar-link">Hoists</Link>
          <Link href="/repairs" className="sidebar-link">Schedule & Repairs</Link>
          <Link href="/reports" className="sidebar-link">Reports</Link>
          <Link href="/customers" className="sidebar-link">Customers</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#FE5000] rounded-2xl flex items-center justify-center shadow-sm">
                <span className="text-white text-4xl font-black">H</span>
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tight">Hoistec</div>
                <div className="text-[10px] text-gray-500 -mt-1 tracking-[2px]">CONSTRUCTION HOIST MANAGEMENT</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/repairs" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Schedule Repair
            </Link>
            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">JD</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Total Hoists</p><p className="text-4xl font-semibold mt-1">{totalHoists}</p></div>
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center"><Truck className="w-7 h-7 text-[#FE5000]" /></div>
            </div>
            <div className="card flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Currently On Site</p><p className="text-4xl font-semibold mt-1">{onSiteHoists}</p></div>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center"><MapPin className="w-7 h-7 text-green-600" /></div>
            </div>
            <div className="card flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Upcoming Repairs</p><p className="text-4xl font-semibold mt-1">{upcomingRepairs}</p></div>
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center"><Calendar className="w-7 h-7 text-yellow-600" /></div>
            </div>
            <div className="card flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Repairs This Month</p><p className="text-4xl font-semibold mt-1">{repairsThisMonth}</p></div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center"><FileText className="w-7 h-7 text-blue-600" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Recent Activity</h3>
                <Link href="/repairs" className="text-sm text-[#FE5000] hover:underline flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></Link>
              </div>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((repair) => {
                    const hoist = hoists.find(h => h.id === repair.hoistId);
                    return (
                      <div key={repair.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                        <div className="w-2 h-2 mt-2.5 rounded-full bg-[#FE5000] flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm"><span className="font-mono text-[#FE5000]">{repair.repairNo}</span> — {repair.description}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{hoist?.serialNumber} • {repair.date} • {repair.technician}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-gray-500">No repairs yet.</p>}
            </div>

            {/* Wind Safety */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Wind Safety</h3>
                <button 
                  onClick={() => setShowWindModal(true)} 
                  className="text-xs text-[#FE5000] hover:underline"
                >
                  View alerts
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div>
                    <p className="font-medium">Safe Conditions</p>
                    <p className="text-sm text-green-600">{safeCount} hoists</p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>

                <div 
                  onClick={() => activeAlerts.length > 0 && setShowWindModal(true)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${activeAlerts.length > 0 ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div>
                    <p className="font-medium">Wind Gust Warning</p>
                    <p className="text-sm text-red-600">{activeAlerts.length} hoists need attention</p>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>

              {formattedLastUpdated && (
                <p className="text-[10px] text-gray-400 mt-3 text-right">
                  Last updated: {formattedLastUpdated}
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Repairs */}
          {upcomingList.length > 0 && (
            <div className="mt-8 card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-lg">Upcoming Repairs</h3>
                <Link href="/repairs" className="text-sm text-[#FE5000] hover:underline">View all</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingList.map((repair) => {
                  const hoist = hoists.find(h => h.id === repair.hoistId);
                  return (
                    <div key={repair.id} className="border rounded-xl p-4 hover:border-[#FE5000]/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm text-[#FE5000]">{repair.repairNo}</p>
                          <p className="font-medium mt-1 line-clamp-2">{repair.description}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 text-xs rounded-full ${repair.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {repair.status}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        {hoist?.serialNumber} • {repair.date} • {repair.technician}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Wind Alerts Modal */}
      {showWindModal && <WindAlertsModal />}
    </div>
  );
}