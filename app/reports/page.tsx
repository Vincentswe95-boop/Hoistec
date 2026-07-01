'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Calendar } from 'lucide-react';
import { useHoists } from '@/context/HoistsContext';
import { useRepairs } from '@/context/RepairsContext';
import { useCustomers } from '@/context/CustomersContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportsPage() {
  const { hoists, getHoistsByCustomer } = useHoists();
  const { getAllRepairs } = useRepairs();
  const { customers, getCustomerById } = useCustomers();

  const allRepairs = getAllRepairs();

  const [reportType, setReportType] = useState<'hoist' | 'customer'>('hoist');
  const [selectedHoistId, setSelectedHoistId] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [fromDate, setFromDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hourlyRate, setHourlyRate] = useState<number>(750);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Get relevant hoists based on selection
  const relevantHoistIds = reportType === 'customer' && selectedCustomerId > 0
    ? getHoistsByCustomer(selectedCustomerId).map(h => h.id)
    : selectedHoistId > 0 ? [selectedHoistId] : [];

  // Filter repairs
  const filteredRepairs = allRepairs.filter(repair => {
    if (relevantHoistIds.length === 0) return false;
    if (!relevantHoistIds.includes(repair.hoistId)) return false;
    const repairDate = repair.date;
    return repairDate >= fromDate && repairDate <= toDate;
  });

  // Calculations
  const totalRepairs = filteredRepairs.length;
  const totalHours = filteredRepairs.reduce((sum, r) => sum + r.hours, 0);
  const totalCost = totalHours * hourlyRate;

  const typeBreakdown = {
    Service: filteredRepairs.filter(r => r.type === 'Service').length,
    Repair: filteredRepairs.filter(r => r.type === 'Repair').length,
    Inspection: filteredRepairs.filter(r => r.type === 'Inspection').length,
    Transport: filteredRepairs.filter(r => r.type === 'Transport').length,
  };

  const handleGenerateReport = () => {
    if (reportType === 'hoist' && selectedHoistId === 0) {
      alert("Please select a hoist");
      return;
    }
    if (reportType === 'customer' && selectedCustomerId === 0) {
      alert("Please select a customer");
      return;
    }

    const selectedCustomer = reportType === 'customer' ? getCustomerById(selectedCustomerId) : null;
    const includedHoists = reportType === 'customer' 
      ? getHoistsByCustomer(selectedCustomerId) 
      : [hoists.find(h => h.id === selectedHoistId)!];

    setGeneratedReport({
      type: reportType,
      customer: selectedCustomer,
      hoist: reportType === 'hoist' ? hoists.find(h => h.id === selectedHoistId) : null,
      includedHoists,
      fromDate,
      toDate,
      hourlyRate,
      repairs: filteredRepairs,
      totalRepairs,
      totalHours,
      totalCost,
      typeBreakdown,
    });
  };

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('monthly-report-content');
    if (!reportElement) return;

    const canvas = await html2canvas(reportElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const filename = generatedReport.type === 'customer' 
      ? `Customer_Report_${generatedReport.customer?.name.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.pdf`
      : `Hoist_Report_${generatedReport.hoist?.serialNumber}_${fromDate}_to_${toDate}.pdf`;
    pdf.save(filename);
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
          <Link href="/reports" className="sidebar-link active">Reports</Link>
          <Link href="/customers" className="sidebar-link">Customers</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold">Reports</h1>
              <p className="text-gray-500 mt-1">Generate accurate billing reports per hoist or per customer</p>
            </div>
          </div>

          {/* Report Generator */}
          <div className="bg-white rounded-2xl border p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">Generate Billing Report</h2>

            {/* Report Type Toggle */}
            <div className="mb-6">
              <label className="text-sm text-gray-600 block mb-2">Report For</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setReportType('hoist')}
                  className={`px-6 py-2 rounded-xl border ${reportType === 'hoist' ? 'bg-[#FE5000] text-white border-[#FE5000]' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  Single Hoist
                </button>
                <button
                  onClick={() => setReportType('customer')}
                  className={`px-6 py-2 rounded-xl border ${reportType === 'customer' ? 'bg-[#FE5000] text-white border-[#FE5000]' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  Customer (All Their Hoists)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Dynamic Selector */}
              {reportType === 'hoist' ? (
                <div className="lg:col-span-2">
                  <label className="text-sm text-gray-600 block mb-2">Hoist</label>
                  <select
                    value={selectedHoistId}
                    onChange={(e) => setSelectedHoistId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3"
                  >
                    <option value={0}>-- Select Hoist --</option>
                    {hoists.map(hoist => (
                      <option key={hoist.id} value={hoist.id}>
                        {hoist.serialNumber} — {hoist.model}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="lg:col-span-2">
                  <label className="text-sm text-gray-600 block mb-2">Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3"
                  >
                    <option value={0}>-- Select Customer --</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* From Date */}
              <div>
                <label className="text-sm text-gray-600 block mb-2">From Date</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3" />
              </div>

              {/* To Date */}
              <div>
                <label className="text-sm text-gray-600 block mb-2">To Date</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3" />
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="text-sm text-gray-600 block mb-2">Hourly Rate (SEK)</label>
                <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full border border-gray-300 rounded-xl px-4 py-3" />
              </div>
            </div>

            <div className="mt-6">
              <button onClick={handleGenerateReport} className="btn-primary flex items-center gap-2 px-8 py-3">
                <Calendar className="w-4 h-4" /> Generate Report
              </button>
            </div>
          </div>

          {/* Generated Report */}
          {generatedReport && (
            <div className="bg-white rounded-2xl border overflow-hidden mb-8">
              <div className="p-8" id="monthly-report-content">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#FE5000] rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">H</span>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold">Hoistec</h1>
                        <p className="text-sm text-gray-500">Billing Report</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Period</p>
                    <p className="font-semibold">{generatedReport.fromDate} → {generatedReport.toDate}</p>
                  </div>
                </div>

                {/* Customer or Hoist Info */}
                {generatedReport.type === 'customer' && generatedReport.customer ? (
                  <div className="border rounded-xl p-6 mb-8">
                    <h3 className="font-semibold mb-4">Customer</h3>
                    <p className="font-semibold text-2xl">{generatedReport.customer.name}</p>
                    <p className="text-gray-600">{generatedReport.customer.contactPerson} • {generatedReport.customer.email}</p>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Hoists included in this report:</p>
                      <div className="flex flex-wrap gap-2">
                        {generatedReport.includedHoists.map((h: any) => (
                          <span key={h.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-mono">{h.serialNumber}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-xl p-6 mb-8">
                    <h3 className="font-semibold mb-4">Hoist Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-gray-500">Serial Number</p><p className="font-semibold">{generatedReport.hoist?.serialNumber}</p></div>
                      <div><p className="text-gray-500">Model</p><p className="font-semibold">{generatedReport.hoist?.model}</p></div>
                      <div><p className="text-gray-500">Manufacturer</p><p className="font-semibold">{generatedReport.hoist?.manufacturer}</p></div>
                      <div><p className="text-gray-500">Current Site</p><p className="font-semibold">{generatedReport.hoist?.currentSite}</p></div>
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-sm text-gray-500">Total Repairs</p>
                    <p className="text-4xl font-bold mt-1">{generatedReport.totalRepairs}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-sm text-gray-500">Total Hours</p>
                    <p className="text-4xl font-bold mt-1">{generatedReport.totalHours}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="text-4xl font-bold mt-1">{generatedReport.hourlyRate} SEK/h</p>
                  </div>
                  <div className="bg-[#FE5000] text-white rounded-xl p-5">
                    <p className="text-sm opacity-90">Total Cost</p>
                    <p className="text-4xl font-bold mt-1">{generatedReport.totalCost.toFixed(0)} SEK</p>
                  </div>
                </div>

                {/* Type Breakdown */}
                <div className="mb-8">
                  <h3 className="font-semibold mb-3">Breakdown by Type</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">Service: <span className="font-semibold">{generatedReport.typeBreakdown.Service}</span></div>
                    <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">Repair: <span className="font-semibold">{generatedReport.typeBreakdown.Repair}</span></div>
                    <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">Inspection: <span className="font-semibold">{generatedReport.typeBreakdown.Inspection}</span></div>
                    <div className="bg-teal-100 text-teal-800 px-4 py-2 rounded-lg">Transport: <span className="font-semibold">{generatedReport.typeBreakdown.Transport}</span></div>
                  </div>
                </div>

                {/* Detailed Repairs Table */}
                <div>
                  <h3 className="font-semibold mb-4">Detailed Repairs</h3>
                  {generatedReport.repairs.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Hoist</th>
                          <th className="text-left py-3 px-4">Type</th>
                          <th className="text-left py-3 px-4">Description</th>
                          <th className="text-left py-3 px-4">Technician</th>
                          <th className="text-center py-3 px-4">Hours</th>
                          <th className="text-right py-3 px-4">Cost (SEK)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {generatedReport.repairs.map((repair: any) => {
                          const repairCost = repair.hours * generatedReport.hourlyRate;
                          const hoist = hoists.find(h => h.id === repair.hoistId);
                          return (
                            <tr key={repair.id}>
                              <td className="py-3 px-4">{repair.date}</td>
                              <td className="py-3 px-4 font-mono text-sm">{hoist?.serialNumber}</td>
                              <td className="py-3 px-4">{repair.type}</td>
                              <td className="py-3 px-4">{repair.description}</td>
                              <td className="py-3 px-4">{repair.technician}</td>
                              <td className="py-3 px-4 text-center font-mono">{repair.hours}h</td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-[#FE5000]">{repairCost.toFixed(0)} SEK</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 py-8 text-center">No repairs found in this period.</p>
                  )}
                </div>
              </div>

              {/* Download Button */}
              <div className="border-t px-8 py-5 flex justify-end">
                <button onClick={handleDownloadPDF} className="btn-primary flex items-center gap-2 px-8">
                  <Download className="w-4 h-4" /> Download PDF Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}