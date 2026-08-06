// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHoists } from '@/context/HoistsContext';
import { useCustomers } from '@/context/CustomersContext';
import { 
  Building2, 
  MapPin, 
  Wrench, 
  Calendar, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  ArrowRight,
  Plus,
  Bell,
  BellOff,
  ShieldAlert
} from 'lucide-react';

type UserRole = 'admin' | 'customer' | 'technician';

// Role-based notification utility function
const sendRoleNotification = (title: string, body: string, targetRole: UserRole, currentUserRole: UserRole, tag?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  if (currentUserRole === 'admin' || currentUserRole === targetRole) {
    new Notification(title, {
      body,
      tag: tag || 'hoistec-alert',
    });
  }
};

interface HoistWindStatus {
  id: number;
  model: string;
  serialNumber: string;
  currentSite: string;
  windSpeedLimit: number;
  currentWindGust: number;
  customerName: string;
  isExceeded: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { hoists } = useHoists();
  const { customers } = useCustomers();

  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [windAlerts, setWindAlerts] = useState<HoistWindStatus[]>([]);
  const [allHoistsStatus, setAllHoistsStatus] = useState<HoistWindStatus[]>([]);
  const [isCheckingWind, setIsCheckingWind] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Role and notification states
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      new Notification('Hoistec Notifications Enabled', {
        body: 'You will now receive desktop alerts based on your user role.',
      });
    }
  };

  // Filter on-site hoists matching your hoists page statuses
  const onSiteHoists = hoists?.filter((h) => {
    const status = h.status?.toLowerCase() || '';
    return status.includes('on site') || status === 'onsite' || status === 'assembling' || status === 'disassembling';
  }) || [];

  const safeHoistsCount = Math.max(0, onSiteHoists.length - windAlerts.length);
  const totalHoists = hoists?.length || 0;
  const upcomingRepairs = 0;
  const repairsThisMonth = 0;

  // Helper to fetch coordinates pinned on individual hoist profile
  const getSiteCoordinates = (hoist: any) => {
    const hoistAny = hoist as any;
    const lat = hoistAny.latitude ?? hoistAny.lat;
    const lng = hoistAny.longitude ?? hoistAny.lng;

    if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      return { lat: Number(lat), lng: Number(lng) };
    }

    return { lat: 65.8258, lng: 21.6887 }; // Default fallback
  };

  const checkWindConditions = async () => {
    if (onSiteHoists.length === 0) {
      setWindAlerts([]);
      setAllHoistsStatus([]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return;
    }

    setIsCheckingWind(true);
    const alerts: HoistWindStatus[] = [];
    const statuses: HoistWindStatus[] = [];

    for (const hoist of onSiteHoists) {
      const customer = customers.find(
        (c: any) => hoist.customerId != null && String(c.id) === String(hoist.customerId)
      );

      const { lat, lng } = getSiteCoordinates(hoist);

      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_gusts_10m&wind_speed_unit=ms`
        );
        const data = await res.json();
        const gust = data?.current?.wind_gusts_10m ?? 0;
        const limit = hoist.windSpeedLimit ?? 15;
        const isExceeded = gust > limit;

        const hoistStatusItem: HoistWindStatus = {
          id: hoist.id,
          model: hoist.model,
          serialNumber: hoist.serialNumber,
          currentSite: hoist.currentSite || customer?.address || 'Unknown Site',
          windSpeedLimit: limit,
          currentWindGust: gust,
          customerName: customer?.name || 'Unassigned Customer',
          isExceeded,
        };

        statuses.push(hoistStatusItem);

        if (isExceeded) {
          alerts.push(hoistStatusItem);

          sendRoleNotification(
            `⚠️ Wind Limit Exceeded (${hoistStatusItem.customerName})`,
            `Hoist ${hoistStatusItem.model} is experiencing gusts of ${gust.toFixed(1)} m/s (Limit: ${limit} m/s).`,
            'customer',
            currentUserRole,
            `wind-hoist-${hoist.id}`
          );
        }
      } catch (err) {
        console.error(`Failed to fetch wind for hoist ${hoist.id}:`, err);
      }
    }

    setAllHoistsStatus(statuses);
    setWindAlerts(alerts);
    setIsCheckingWind(false);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  useEffect(() => {
    checkWindConditions();
  }, [hoists, customers, currentUserRole]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Role Switcher Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-xs text-gray-500">Monitor active hoists, pinned locations, and live role notifications.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Role Simulation Switcher */}
          <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase px-2">Role:</span>
            {(['admin', 'customer', 'technician'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setCurrentUserRole(role)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  currentUserRole === role 
                    ? 'bg-[#FE5000] text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Notification Permission Toggle - Hidden for Technicians */}
          {currentUserRole !== 'technician' && (
            notificationPermission !== 'granted' ? (
              <button
                onClick={requestNotificationPermission}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-xl transition-colors shadow-sm"
              >
                <BellOff className="w-4 h-4 text-gray-500" /> Enable Push
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-100">
                <Bell className="w-4 h-4 text-emerald-600" /> Notifications Active
              </div>
            )
          )}

          {/* Add Hoist Button - Hidden for Technicians */}
          {currentUserRole !== 'technician' && (
            <button
              onClick={() => router.push('/hoists/new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#FE5000] text-white font-medium text-xs rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Hoist
            </button>
          )}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Hoists</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalHoists}</p>
          </div>
          <div className="p-3 bg-orange-50 text-[#FE5000] rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Currently On Site</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{onSiteHoists.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upcoming Repairs</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingRepairs}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Repairs This Month</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{repairsThisMonth}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Active Hoists Fleet</h2>
            <button
              onClick={() => router.push('/hoists')}
              className="text-sm font-medium text-[#FE5000] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {!hoists ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading hoists...</p>
          ) : hoists.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-gray-500">No hoists registered yet.</p>
              {currentUserRole !== 'technician' && (
                <button
                  onClick={() => router.push('/hoists/new')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
                >
                  Create your first hoist
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {hoists.slice(0, 5).map((hoist) => (
                <div 
                  key={hoist.id} 
                  onClick={() => router.push(`/hoists/${hoist.id}`)}
                  className="py-3.5 flex items-center justify-between hover:bg-gray-50 px-3 rounded-xl cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">{hoist.model}</p>
                    <p className="text-xs text-gray-500 font-mono">Serial: {hoist.serialNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      hoist.status === 'On Site' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {hoist.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wind Safety Widget */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Wind Safety</h2>
              <button
                onClick={() => setIsAlertsModalOpen(true)}
                className="text-sm font-medium text-[#FE5000] hover:underline"
              >
                View alerts
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-900">Safe Conditions</p>
                  <p className="text-xs text-emerald-700 mt-0.5">{safeHoistsCount} hoists operating normally</p>
                </div>
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                windAlerts.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
              }`}>
                <div>
                  <p className={`text-sm font-bold ${windAlerts.length > 0 ? 'text-red-900' : 'text-gray-700'}`}>
                    Wind Gust Warning
                  </p>
                  <p className={`text-xs mt-0.5 ${windAlerts.length > 0 ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
                    {windAlerts.length} hoists need attention
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${windAlerts.length > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-right">
            Last updated: {lastUpdated || 'Just now'}
          </div>
        </div>
      </div>

      {/* Wind Alerts & Fleet Overview Modal */}
      {isAlertsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-[#FE5000]" />
                <h3 className="text-lg font-bold text-gray-900">Wind Alerts & Fleet Status</h3>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  windAlerts.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {windAlerts.length} Active Warnings
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={checkWindConditions}
                  disabled={isCheckingWind}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingWind ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setIsAlertsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto space-y-6 pr-1">
              {windAlerts.length === 0 && (
                <div className="text-center py-6 px-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-base font-bold text-gray-900">All hoists are within safe wind limits!</p>
                  <p className="text-xs text-emerald-700">No active wind gust warnings across your on-site fleet.</p>
                </div>
              )}

              {windAlerts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider">Active Warnings Requiring Attention</h4>
                  {windAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{alert.model} ({alert.serialNumber})</p>
                        <p className="text-xs text-gray-600 mt-0.5">Site: {alert.currentSite} • Customer: {alert.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">{alert.currentWindGust.toFixed(1)} m/s</p>
                        <p className="text-xs text-gray-500">Limit: {alert.windSpeedLimit} m/s</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">All On-Site Hoists & Current Gust Speeds</h4>
                {allHoistsStatus.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No active on-site hoists found to monitor.</p>
                ) : (
                  <div className="space-y-2.5">
                    {allHoistsStatus.map((hoist) => {
                      const percentage = Math.min(100, Math.round((hoist.currentWindGust / hoist.windSpeedLimit) * 100));
                      return (
                        <div key={hoist.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{hoist.model} <span className="text-xs font-normal text-gray-500 font-mono">({hoist.serialNumber})</span></p>
                              <p className="text-xs text-gray-500 mt-0.5">Site: {hoist.currentSite}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                                hoist.isExceeded 
                                  ? 'bg-red-100 text-red-700' 
                                  : percentage >= 80 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {hoist.currentWindGust.toFixed(1)} m/s / Limit: {hoist.windSpeedLimit} m/s
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                hoist.isExceeded ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">Last updated: {lastUpdated || 'Just now'}</span>
              <button
                onClick={() => setIsAlertsModalOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
