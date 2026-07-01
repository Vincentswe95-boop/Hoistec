'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, X, Edit2, Trash2, Printer, Download } from 'lucide-react';
import { useHoists } from '@/context/HoistsContext';
import { useRepairs, RepairType, Repair } from '@/context/RepairsContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function RepairsSchedulePage() {
  const { hoists } = useHoists();
  const { getAllRepairs, addRepair, updateRepair, deleteRepair } = useRepairs();

  const allRepairs = getAllRepairs();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<RepairType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | Repair['status']>('All');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [viewingRepair, setViewingRepair] = useState<Repair | null>(null);

  const [repairForm, setRepairForm] = useState({
    hoistId: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'Service' as RepairType,
    description: '',
    technician: '',
    hours: 2,
    parts: '',
    status: 'Scheduled' as Repair['status'],
  });

  const filteredRepairs = allRepairs.filter((repair) => {
    const hoist = hoists.find(h => h.id === repair.hoistId);
    const matchesSearch =
      repair.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.repairNo.includes(searchTerm) ||
      (hoist && hoist.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'All' || repair.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || repair.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const statusColors: any = {
    Scheduled: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    Completed: 'bg-green-100 text-green-700',
  };

  // PDF Download
  const handleDownloadPDF = async () => {
    if (!viewingRepair) return;
    const reportElement = document.getElementById('repair-report-content');
    if (!reportElement) return;

    const canvas = await html2canvas(reportElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Repair_Report_${viewingRepair.repairNo}.pdf`);
  };

  // Create Modal
  const openCreateModal = () => {
    const defaultHoistId = hoists.length > 0 ? hoists[0].id : 0;
    setRepairForm({
      hoistId: defaultHoistId,
      date: new Date().toISOString().split('T')[0],
      type: 'Service',
      description: '',
      technician: '',
      hours: 2,
      parts: '',
      status: 'Scheduled',
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  // Edit Modal
  const openEditModal = (repair: Repair) => {
    setEditingRepair(repair);
    setRepairForm({
      hoistId: repair.hoistId,
      date: repair.date,
      type: repair.type,
      description: repair.description,
      technician: repair.technician,
      hours: repair.hours,
      parts: repair.parts,
      status: repair.status,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRepair(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRepairForm(prev => ({
      ...prev,
      [name]: name === 'hours' || name === 'hoistId' ? parseInt(value) : value,
    }));
  };

  const handleSubmitCreate = () => {
    if (!repairForm.description || !repairForm.technician || repairForm.hoistId === 0) {
      alert("Please fill in Hoist, Description and Technician");
      return;
    }
    addRepair(repairForm);
    closeCreateModal();
  };

  const handleSubmitEdit = () => {
    if (!editingRepair) return;
    updateRepair(editingRepair.id, repairForm);
    closeEditModal();
  };

  const handleDelete = (id: number, repairNo: string) => {
    if (confirm(`Delete repair #${repairNo}?`)) {
      deleteRepair(id);
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
  <Link href="/customers" className="sidebar-link">Customers</Link>
</nav>      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold">Schedule & Repairs</h1>
              <p className="text-gray-500 mt-1">{filteredRepairs.length} repairs found</p>
            </div>
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Schedule Repair
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search repair no, description or technician..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select className="border border-gray-300 rounded-xl px-4 py-3" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
              <option value="All">All Types</option>
              <option value="Service">Service</option>
              <option value="Repair">Repair</option>
              <option value="Inspection">Inspection</option>
              <option value="Transport">Transport</option>
            </select>
            <select className="border border-gray-300 rounded-xl px-4 py-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-28 px-6 py-4 text-left text-sm font-medium text-gray-600">Repair No.</th>
                  <th className="w-28 px-6 py-4 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="w-32 px-6 py-4 text-left text-sm font-medium text-gray-600">Hoist</th>
                  <th className="w-24 px-6 py-4 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Description</th>
                  <th className="w-36 px-6 py-4 text-left text-sm font-medium text-gray-600">Technician</th>
                  <th className="w-20 px-6 py-4 text-center text-sm font-medium text-gray-600">Hours</th>
                  <th className="w-28 px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="w-24 px-6 py-4 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredRepairs.length > 0 ? (
                  filteredRepairs.map((repair) => {
                    const hoist = hoists.find(h => h.id === repair.hoistId);
                    return (
                      <tr key={repair.id} className="hover:bg-gray-50">
                        <td 
                          className="px-6 py-4 font-mono font-semibold text-[#FE5000] cursor-pointer hover:underline"
                          onClick={() => setViewingRepair(repair)}
                        >
                          {repair.repairNo}
                        </td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{repair.date}</td>
                        <td className="px-6 py-4">
                          {hoist ? (
                            <Link href={`/hoists/${hoist.id}`} className="text-[#FE5000] hover:underline font-mono">
                              {hoist.serialNumber}
                            </Link>
                          ) : 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {repair.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{repair.description}</td>
                        <td className="px-6 py-4 text-gray-600">{repair.technician}</td>
                        <td className="px-6 py-4 text-center font-mono text-gray-600">{repair.hours}h</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[repair.status]}`}>
                            {repair.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditModal(repair)} className="p-2 text-gray-500 hover:text-[#FE5000] hover:bg-orange-50 rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(repair.id, repair.repairNo)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">No repairs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Repair Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Schedule New Repair</h2>
              <button onClick={closeCreateModal}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Hoist</label>
                <select name="hoistId" value={repairForm.hoistId} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5">
                  {hoists.map(h => <option key={h.id} value={h.id}>{h.serialNumber} — {h.model}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Date</label>
                  <input type="date" name="date" value={repairForm.date} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Type</label>
                  <select name="type" value={repairForm.type} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5">
                    <option value="Service">Service</option>
                    <option value="Repair">Repair</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Transport">Transport</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Description</label>
                <textarea name="description" value={repairForm.description} onChange={handleInputChange} rows={3} className="w-full border rounded-lg px-4 py-2.5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Technician</label>
                  <input name="technician" value={repairForm.technician} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Hours</label>
                  <input type="number" step="0.5" name="hours" value={repairForm.hours} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Parts Used</label>
                <input name="parts" value={repairForm.parts} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Status</label>
                <select name="status" value={repairForm.status} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5">
                  <option>Scheduled</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={closeCreateModal} className="px-6 py-2.5 border border-gray-300 rounded-xl">Cancel</button>
              <button onClick={handleSubmitCreate} className="btn-primary px-8">Create Repair</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Repair Modal */}
      {isEditModalOpen && editingRepair && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Edit Repair #{editingRepair.repairNo}</h2>
              <button onClick={closeEditModal}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Date</label>
                  <input type="date" name="date" value={repairForm.date} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Type</label>
                  <select name="type" value={repairForm.type} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5">
                    <option value="Service">Service</option>
                    <option value="Repair">Repair</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Transport">Transport</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Description</label>
                <textarea name="description" value={repairForm.description} onChange={handleInputChange} rows={3} className="w-full border rounded-lg px-4 py-2.5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Technician</label>
                  <input name="technician" value={repairForm.technician} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Hours</label>
                  <input type="number" step="0.5" name="hours" value={repairForm.hours} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Parts Used</label>
                <input name="parts" value={repairForm.parts} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5" />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Status</label>
                <select name="status" value={repairForm.status} onChange={handleInputChange} className="w-full border rounded-lg px-4 py-2.5">
                  <option>Scheduled</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={closeEditModal} className="px-6 py-2.5 border border-gray-300 rounded-xl">Cancel</button>
              <button onClick={handleSubmitEdit} className="btn-primary px-8">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Repair Report Modal (with Hoistec logo + signature) */}
      {viewingRepair && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 print:bg-white">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
            
            {/* Header */}
            <div className="bg-[#FE5000] px-8 py-6 flex justify-between items-center print:bg-white print:border-b-2 print:border-[#FE5000]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <span className="text-[#FE5000] text-4xl font-black">H</span>
                  </div>
                  <div>
                    <div className="text-white print:text-[#FE5000] text-3xl font-bold tracking-tight">Hoistec</div>
                    <div className="text-[10px] text-orange-100 -mt-1 tracking-[2px] print:text-gray-500">CONSTRUCTION HOIST MANAGEMENT</div>
                  </div>
                </div>
              </div>

              <div className="text-right text-white print:text-black">
                <div className="text-xs opacity-90 print:text-gray-500 tracking-widest">REPAIR REPORT</div>
                <div className="text-4xl font-mono font-bold tracking-[3px] print:text-black">
                  {viewingRepair.repairNo}
                </div>
              </div>
            </div>

            <div className="p-8 print:p-6" id="repair-report-content">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hoist</p>
                  <p className="font-semibold text-2xl tracking-tight">
                    {hoists.find(h => h.id === viewingRepair.hoistId)?.serialNumber}
                  </p>
                  <p className="text-gray-600">
                    {hoists.find(h => h.id === viewingRepair.hoistId)?.model} • {hoists.find(h => h.id === viewingRepair.hoistId)?.manufacturer}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Date of Work</p>
                  <p className="font-semibold text-2xl tracking-tight">{viewingRepair.date}</p>
                  <p className="text-gray-600">{viewingRepair.type}</p>
                </div>
              </div>

              <div className="border rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-lg mb-5">Work Performed</h3>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5 tracking-wider">TECHNICIAN</p>
                    <p className="font-semibold text-lg">{viewingRepair.technician}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5 tracking-wider">HOURS SPENT</p>
                    <p className="font-semibold text-lg">{viewingRepair.hours} hours</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs mb-0.5 tracking-wider">DESCRIPTION</p>
                    <p className="font-medium whitespace-pre-wrap leading-relaxed text-[15px]">{viewingRepair.description}</p>
                  </div>
                  {viewingRepair.parts && (
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs mb-0.5 tracking-wider">PARTS / MATERIALS USED</p>
                      <p className="font-medium">{viewingRepair.parts}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-end gap-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1.5">Status</p>
                  <span className={`inline-block px-6 py-2 rounded-full text-sm font-semibold ${statusColors[viewingRepair.status]}`}>
                    {viewingRepair.status}
                  </span>
                </div>

                {/* Signature Field */}
                <div className="flex-1 max-w-[280px]">
                  <p className="text-sm text-gray-500 mb-1">Technician Signature</p>
                  <div className="border-b border-gray-300 h-12 flex items-end pb-1">
                    <div className="w-full text-center text-gray-400 text-xs">Signature</div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <div>Date: ________________</div>
                    <div>Name: ________________</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t px-8 py-5 flex justify-end gap-3 print:hidden">
              <button onClick={() => setViewingRepair(null)} className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50">Close</button>
              <button onClick={handleDownloadPDF} className="btn-primary flex items-center gap-2 px-6">
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}