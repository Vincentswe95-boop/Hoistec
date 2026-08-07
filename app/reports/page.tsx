// app/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { FileText, Download, Calendar } from 'lucide-react';
import { useHoists } from '@/context/HoistsContext';
import { useCustomers } from '@/context/CustomersContext';
import { useRepairs } from '@/context/RepairsContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
);

export default function ReportsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const { hoists } = useHoists();
  const { customers } = useCustomers();
  const { getAllRepairs } = useRepairs();

  const [reportType, setReportType] = useState<'hoist' | 'customer'>('hoist');
  const [selectedHoistId, setSelectedHoistId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hourlyRate, setHourlyRate] = useState(750);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Route protection and authorization check
  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) {
          router.push('/login');
          return;
        }

        // Check user role in database
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
      } catch (err) {
        console.error('Authorization check failed:', err);
        router.push('/');
      }
    };

    verifyAndLoad();
  }, [router]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const allRepairs = getAllRepairs();

    let filtered = allRepairs.filter(r => r.date >= fromDate && r.date <= toDate);

    if (reportType === 'hoist') {
      if (!selectedHoistId) {
        alert('Please select a hoist.');
        return;
      }
      filtered = filtered.filter(r => String(r.hoistId) === String(selectedHoistId));
    } else {
      if (!selectedCustomerId) {
        alert('Please select a customer.');
        return;
      }
      const customerHoists = hoists
        .filter(h => String(h.customerId) === String(selectedCustomerId))
        .map(h => String(h.id));
      filtered = filtered.filter(r => customerHoists.includes(String(r.hoistId)));
    }

    const totalHours = filtered.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    const totalCost = totalHours * hourlyRate;

    setGeneratedReport({
      type: reportType,
      targetName: reportType === 'hoist' 
        ? hoists.find(h => String(h.id) === String(selectedHoistId))?.serialNumber 
        : customers.find(c => String(c.id) === String(selectedCustomerId))?.name,
      fromDate,
      toDate,
      hourlyRate,
      repairs: filtered,
      totalHours,
      totalCost,
    });
  };

  // Prevent flash while verifying authorization
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Generate accurate billing reports per hoist or per customer</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Generate Billing Report</h3>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report For</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setReportType('hoist')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm border transition-colors ${
                  reportType === 'hoist' 
                    ? 'bg-[#FE5000] text-white border-[#FE5000] shadow-sm' 
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Single Hoist
              </button>
              <button
                type="button"
                onClick={() => setReportType('customer')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm border transition-colors ${
                  reportType === 'customer' 
                    ? 'bg-[#FE5000] text-white border-[#FE5000] shadow-sm' 
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Customer (All Their Hoists)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportType === 'hoist' ? (
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Hoist</label>
                <select
                  value={selectedHoistId}
                  onChange={(e) => setSelectedHoistId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]"
                >
                  <option value="">-- Select Hoist --</option>
                  {hoists.map(h => (
                    <option key={h.id} value={h.id}>{h.serialNumber} ({h.model || 'No Model'})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (SEK)</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full md:w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5000]/20 focus:border-[#FE5000]"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#FE5000] text-white font-medium text-sm rounded-xl hover:bg-orange-600 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Generate Report
          </button>
        </form>
      </div>

      {generatedReport && (
        <div className="card space-y-6">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h3 className="text-xl font-bold">Billing Report: {generatedReport.targetName}</h3>
              <p className="text-sm text-gray-500">Period: {generatedReport.fromDate} to {generatedReport.toDate}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Print / Export
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Tasks</p>
              <p className="text-2xl font-bold">{generatedReport.repairs.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Hours</p>
              <p className="text-2xl font-bold font-mono">{generatedReport.totalHours}h</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Hourly Rate</p>
              <p className="text-2xl font-bold font-mono">{generatedReport.hourlyRate} SEK</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Cost</p>
              <p className="text-2xl font-bold font-mono text-[#FE5000]">{generatedReport.totalCost.toLocaleString()} SEK</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-400 uppercase">
                  <th className="py-3 px-4">Repair No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4 text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {generatedReport.repairs.length > 0 ? (
                  generatedReport.repairs.map((r: any) => (
                    <tr key={r.id}>
                      <td className="py-3 px-4 font-mono font-semibold text-[#FE5000]">{r.repairNo}</td>
                      <td className="py-3 px-4 text-gray-600">{r.date}</td>
                      <td className="py-3 px-4">{r.type}</td>
                      <td className="py-3 px-4 text-gray-800">{r.description}</td>
                      <td className="py-3 px-4 text-gray-600">{r.technician}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">{r.hours}h</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">No repair records found for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}