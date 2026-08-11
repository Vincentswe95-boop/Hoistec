// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useHoists } from '@/context/HoistsContext';
import { useRepairs } from '@/context/RepairsContext';
import { useCustomers } from '@/context/CustomersContext';
import { 
  Wrench, 
  Building2, 
  Clock, 
  Shield, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowUpRight, 
  Activity, 
  RefreshCw 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { hoists = [] } = useHoists();
  const { repairs = [] } = useRepairs();
  const { customers = [] } = useCustomers();

  // Wind Monitoring State (Open-Meteo Live Data for Site Safety)
  const [windData, setWindData] = useState<{
    speed: number;
    gusts: number;
    direction: number;
    status: 'SAFE' | 'CAUTION' | 'DANGER';
  }>({
    speed: 8.4,
    gusts: 11.2,
    direction: 210,
    status: 'SAFE',
  });

  const [loadingWind, setLoadingWind] = useState(false);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);

  // Fetch live wind data (Coordinates: Boden site)
  const fetchLiveWindData = async () => {
    setLoadingWind(true);
    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=65.8252&longitude=21.6886&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m&wind_speed_unit=ms'
      );
      const data = await res.json();
      if (data?.current) {
        const speed = Math.round(data.current.wind_speed_10m * 10) / 10;
        const gusts = Math.round(data.current.wind_gusts_10m * 10) / 10;
        const direction = data.current.wind_direction_10m;

        let status: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
        if (gusts >= 18.0 || speed >= 15.0) {
          status = 'DANGER';
        } else if (gusts >= 12.0 || speed >= 10.0) {
          status = 'CAUTION';
        }

        setWindData({ speed, gusts, direction, status });
      }
    } catch (err) {
      console.error('Failed to fetch Open-Meteo wind data:', err);
    } finally {
      setLoadingWind(false);
    }
  };

  useEffect(() => {
    fetchLiveWindData();
    const interval = setInterval(fetchLiveWindData, 5 * 60 * 1000); // Auto-refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs text-gray-400 font-medium">
        Loading Hoistec Dashboard...
      </div>
    );
  }

  // Derived statistics from database
  const activeHoists = hoists.filter((h: any) => h.status !== 'Decommissioned');
  const activeHoistsCount = activeHoists.length;
  const pendingRepairsCount = repairs.filter((r: any) => r.status !== 'Completed').length;
  const activeCustomersCount = customers.length;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FE5000] font-extrabold flex items-center justify-center text-lg shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Welcome back, {user?.name || 'Vincent Bergström'}!</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#FE5000]" /> Role: <strong className="uppercase text-gray-700">{user?.role || 'ADMIN'}</strong>
              </span>
              <span>•</span>
              <span>{user?.email || 'vincent.bergstrom@renta.se'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.role?.toLowerCase() === 'admin' && (
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
        </div>
      </div>

      {/* Wind Safety Live Banner */}
      <div className={`p-6 rounded-3xl border shadow-xs transition-all ${
        windData.status === 'DANGER'
          ? 'bg-red-50 border-red-200 text-red-900'
          : windData.status === 'CAUTION'
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-transparent'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${
              windData.status === 'DANGER' ? 'bg-red-100 text-red-600' : 'bg-white/20 text-white'
            }`}>
              <Wind className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Site Wind & Gust Telemetry</h2>
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                  windData.status === 'DANGER'
                    ? 'bg-red-600 text-white'
                    : windData.status === 'CAUTION'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {windData.status === 'DANGER' ? 'STOP WORK ALERT' : windData.status === 'CAUTION' ? 'HIGH GUST WARNING' : 'OPERATIONAL SAFE'}
                </span>
              </div>
              <p className="text-xs opacity-90 mt-0.5 font-medium">
                Real-time weather threshold monitoring for mast hoists. Operational cutoff threshold: 14.0 m/s.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/20 pt-3 md:pt-0">
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">Current Wind / Gusts</span>
              <span className="text-2xl font-black">{windData.speed} m/s <span className="text-sm font-semibold opacity-90">({windData.gusts} m/s peak)</span></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchLiveWindData}
                disabled={loadingWind}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                title="Refresh Wind Data"
              >
                <RefreshCw className={`w-4 h-4 ${loadingWind ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowTelemetryModal(true)}
                className="px-4 py-2.5 bg-white text-gray-900 hover:bg-gray-100 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                Telemetry <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => router.push('/hoists')}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-orange-200 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FE5000] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Operational</span>
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900">{activeHoistsCount}</span>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Active Fleet Hoists</h3>
          </div>
        </div>

        <div 
          onClick={() => router.push('/repairs')}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-orange-200 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Pending Tasks</span>
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900">{pendingRepairsCount}</span>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Scheduled Repairs</h3>
          </div>
        </div>

        <div 
          onClick={() => router.push('/customers')}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-orange-200 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Active Sites</span>
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900">{activeCustomersCount}</span>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Bound Customers</h3>
          </div>
        </div>

        <div 
          onClick={() => setShowTelemetryModal(true)}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-orange-200 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Telemetry</span>
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900">{windData.speed} m/s</span>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Peak Wind Speed</h3>
          </div>
        </div>
      </div>

      {/* Database-Synced Fleet Overview Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Active Hoist Fleet Status</h2>
            <p className="text-xs text-gray-500 font-medium">Real-time status synced directly from your database.</p>
          </div>
          <button 
            onClick={() => router.push('/hoists')}
            className="text-xs font-bold text-[#FE5000] hover:text-orange-600 transition-colors"
          >
            View All Hoists →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-4">INDIVIDUAL NO.</th>
                <th className="py-3 px-4">MODEL</th>
                <th className="py-3 px-4">CURRENT SITE</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">WIND SAFETY LIMIT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
              {hoists.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                    No hoists registered in database yet.
                  </td>
                </tr>
              ) : (
                hoists.map((hoist: any) => {
                  // Property extractions
                  const individualNo = hoist.individual_number || hoist.individual_no || hoist.individual_id || '-';
                  const modelName = hoist.model || hoist.name || '-';

                  // Customer matching
                  const boundCustomer = customers.find(
                    (c: any) => c.id === hoist.customer_id || c.name === hoist.customer_name
                  );
                  const customerDisplay = boundCustomer?.name || hoist.customer || hoist.customer_name || 'Unassigned Customer';
                  const siteDisplay = hoist.current_site || hoist.site || hoist.site_location || 'Unassigned Site';

                  // Status badge logic
                  const statusLower = (hoist.status || '').toLowerCase();
                  const isOnSite = statusLower === 'on site' || statusLower === 'operational' || statusLower === 'active';
                  const isOffSite = statusLower === 'off site';

                  return (
                    <tr key={hoist.id || hoist.serial_number || individualNo} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{individualNo}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">{modelName}</td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {siteDisplay}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{customerDisplay}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-700 font-semibold">
                          {hoist.max_wind_speed || hoist.wind_limit || 14} m/s Max
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isOnSite 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : isOffSite 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOnSite ? 'bg-emerald-500' : isOffSite ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          {hoist.status || 'On Site'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => router.push('/hoists')} 
                          className="text-xs font-bold text-gray-500 hover:text-[#FE5000] cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telemetry Modal */}
      {showTelemetryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-[#FE5000] rounded-xl">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Live Site Telemetry</h3>
                  <p className="text-xs text-gray-500 font-medium">Open-Meteo Weather Station (65.82°N, 21.68°E)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTelemetryModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium text-gray-600">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Sustained Wind</span>
                  <span className="text-2xl font-extrabold text-gray-900">{windData.speed} m/s</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Peak Gust Speed</span>
                  <span className="text-2xl font-extrabold text-[#FE5000]">{windData.gusts} m/s</span>
                </div>
              </div>

              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/60 space-y-2">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FE5000]" /> Safety Guidelines
                </h4>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Construction hoists must cease operation if sustained winds exceed <strong>14.0 m/s</strong> or gusts exceed <strong>18.0 m/s</strong>. Ensure all tie-ins and anchors are inspected.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTelemetryModal(false)}
              className="w-full py-3 bg-[#FE5000] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Close Telemetry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
