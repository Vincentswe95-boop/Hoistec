// app/repairs/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, FileText, X, Download } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
);

export default function NewRepairPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dropdown data options
  const [hoists, setHoists] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    repair_no: `2026-${Math.floor(100000 + Math.random() * 900000)}`,
    hoist_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Service',
    description: '',
    comments: '',
    technician: '',
    hours: '0',
    parts: '',
    status: 'Scheduled',
    file_url: '',
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  async function fetchDropdownData() {
    try {
      const hoistsRes = await supabase.from('hoists').select('*');
      if (hoistsRes.data) setHoists(hoistsRes.data);

      const usersRes = await supabase.from('users').select('*');
      if (usersRes.data) setTechnicians(usersRes.data);
    } catch (err) {
      console.error('Error fetching relational data:', err);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadingFile(true);
    setErrorMsg('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `repair-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('repairs')
        .upload(filePath, file);

      if (uploadError) {
        setErrorMsg(`Storage upload note: ${uploadError.message}. Make sure a public storage bucket named 'repairs' exists.`);
        setUploadingFile(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('repairs')
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, file_url: publicUrlData.publicUrl }));
    } catch (err: any) {
      setErrorMsg(`File upload failed: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!formData.hoist_id) {
      setErrorMsg('Please select a valid hoist.');
      setLoading(false);
      return;
    }

    try {
      // Combine description and comments if comments are provided
      const fullDescription = [formData.description, formData.comments ? `Notes: ${formData.comments}` : '']
        .filter(Boolean)
        .join('\n\n');

      const { error } = await supabase.from('repairs').insert([
        {
          repair_no: formData.repair_no,
          hoist_id: Number(formData.hoist_id),
          date: formData.date,
          type: formData.type,
          description: fullDescription || null,
          technician: formData.technician || null,
          hours: Number(formData.hours) || 0,
          parts: formData.parts || null,
        },
      ]);

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else {
        router.refresh();
        router.push('/repairs');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl text-gray-700 cursor-pointer transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Schedule New Task</h1>
              <span className="px-3 py-1 bg-orange-100 text-[#FE5000] font-extrabold rounded-full text-xs shadow-xs">
                {formData.repair_no}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">Create a new service, repair, or inspection order</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold shadow-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold text-gray-700 mb-2">Select Hoist</label>
            <select
              name="hoist_id"
              value={formData.hoist_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-semibold text-gray-800 outline-none focus:border-[#FE5000] focus:bg-white transition-all"
            >
              <option value="">-- Choose Hoist --</option>
              {hoists.map((h) => {
                const individualNo = h.individual_number || 'N/A';
                const serialNo = h.serial_number || 'N/A';
                const model = h.model || '';
                
                const hoistLabel = `Individual No: ${individualNo} | Serial No: ${serialNo}${model ? ` (${model})` : ''}`;

                return (
                  <option key={h.id} value={h.id}>
                    {hoistLabel}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-semibold text-gray-800 outline-none focus:border-[#FE5000] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-semibold text-gray-800 outline-none focus:border-[#FE5000] focus:bg-white transition-all"
            >
              <option value="Service">Service</option>
              <option value="Repair">Repair</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">Technician</label>
            <select
              name="technician"
              value={formData.technician}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-semibold text-gray-800 outline-none focus:border-[#FE5000] focus:bg-white transition-all"
            >
              <option value="">-- Unassigned / Choose Technician --</option>
              {technicians.map((t) => {
                const techName = t.name || t.full_name || t.email || `User #${t.id}`;
                return (
                  <option key={t.id} value={techName}>
                    {techName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">Estimated Hours</label>
            <input
              type="number"
              step="0.5"
              name="hours"
              value={formData.hours}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-semibold text-gray-800 outline-none focus:border-[#FE5000] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Details about the task or issue..."
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-medium text-gray-800 outline-none focus:border-[#FE5000] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-2">Comments / Notes</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows={2}
            placeholder="Additional comments or instructions..."
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-medium text-gray-800 outline-none focus:border-[#FE5000] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-2">Parts Needed</label>
          <input
            type="text"
            name="parts"
            value={formData.parts}
            onChange={handleChange}
            placeholder="Required spare parts..."
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-medium text-gray-800 outline-none focus:border-[#FE5000] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-2">Attach Files / Documents</label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-gray-600" />
              {uploadingFile ? 'Uploading...' : 'Choose File'}
              <input type="file" onChange={handleFileChange} className="hidden" />
            </label>
            {selectedFile && (
              <div className="flex items-center gap-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 font-medium">
                <FileText className="w-4 h-4 text-[#FE5000]" />
                <span className="truncate max-w-xs">{selectedFile.name}</span>
                {formData.file_url && (
                  <a
                    href={formData.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#FE5000] text-white rounded-lg text-[10px] font-bold hover:bg-orange-600 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFormData((prev) => ({ ...prev, file_url: '' }));
                  }}
                  className="text-gray-400 hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploadingFile}
            className="flex items-center gap-2 px-6 py-3 bg-[#FE5000] hover:bg-orange-600 text-white font-bold rounded-2xl shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving Task...' : 'Save Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
