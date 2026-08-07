// app/schedule/edit/[id]/page.tsx
'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Send, 
  CheckCircle2, 
  User, 
  Image as ImageIcon, 
  Trash2,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string;
  author: string;
  role: string;
  text: string;
  date: string;
}

interface RepairFile {
  id: string;
  name: string;
  url: string;
  size: string;
  date: string;
}

const AVAILABLE_TECHNICIANS = [
  'Alex Nymo',
  'John Doe',
  'Erik Lindqvist',
  'Lars Svensson',
  'Mikael Blom'
];

export default function EditRepairPage({ params }: { params: { id: string } }) {
  // Repair Ticket Form State matching your current layout
  const [hoist, setHoist] = useState('GEDA 500 Z/ZP-2 SL (Serial: 5564005241)');
  const [date, setDate] = useState('2026-08-06');
  const [type, setType] = useState('Service');
  const [description, setDescription] = useState('asdasd');
  const [technician, setTechnician] = useState('Alex Nymo'); // Default assigned tech from role
  const [hours, setHours] = useState('0');
  const [partsUsed, setPartsUsed] = useState('asad');
  const [status, setStatus] = useState('Scheduled');

  // Technician & File state extensions
  const [comments, setComments] = useState<Comment[]>([
    { id: '1', author: 'Admin User', role: 'admin', text: 'Initial ticket generated for routine check.', date: '2026-08-06 09:00' }
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  
  const [files, setFiles] = useState<RepairFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('Repair ticket updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComm: Comment = {
      id: Date.now().toString(),
      author: technician || 'Technician',
      role: 'technician',
      text: newCommentText.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setComments([...comments, newComm]);
    setNewCommentText('');
    setSuccessMessage('Comment added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleUploadPicture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingFile) return;

    setIsUploading(true);
    try {
      const fileName = `repair_${params.id}_${Date.now()}_${uploadingFile.name.replace(/\s+/g, '_')}`;
      const filePath = `repair-files/${fileName}`;

      // Uploads directly to your Supabase 'hoist-documents' bucket
      const { error: uploadError } = await supabase.storage
        .from('hoist-documents')
        .upload(filePath, uploadingFile);

      if (uploadError) {
        alert(`Upload error: ${uploadError.message}. Make sure the 'hoist-documents' bucket exists in Supabase.`);
        setIsUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('hoist-documents')
        .getPublicUrl(filePath);

      const newFile: RepairFile = {
        id: Date.now().toString(),
        name: uploadingFile.name,
        url: publicUrlData.publicUrl,
        size: `${(uploadingFile.size / (1024 * 1024)).toFixed(1)} MB`,
        date: new Date().toISOString().split('T')[0]
      };

      setFiles([...files, newFile]);
      setUploadingFile(null);
      setSuccessMessage('Picture uploaded successfully to hoist-documents!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Top Header & Back Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Edit Repair: {params.id || '2026-155294'}</h1>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMessage}
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        
        {/* Select Hoist */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700">Select Hoist *</label>
          <select
            value={hoist}
            onChange={(e) => setHoist(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000]"
          >
            <option value="GEDA 500 Z/ZP-2 SL (Serial: 5564005241)">GEDA 500 Z/ZP-2 SL (Serial: 5564005241)</option>
            <option value="Alimak Scando 650 (Serial: N817541)">Alimak Scando 650 (Serial: N817541)</option>
          </select>
        </div>

        {/* Date & Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000]"
            >
              <option value="Service">Service</option>
              <option value="Repair">Repair</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000]"
          />
        </div>

        {/* Technician Role Assignment & Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Technician (Assigned from Role)</label>
            <select
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-[#FE5000]"
            >
              <option value="">Unassigned</option>
              {AVAILABLE_TECHNICIANS.map((tech) => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Hours</label>
            <input
              type="text"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000]"
            />
          </div>
        </div>

        {/* Parts Used */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700">Parts Used</label>
          <input
            type="text"
            value={partsUsed}
            onChange={(e) => setPartsUsed(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000]"
          />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#FE5000]"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* --- TECHNICIAN FEATURE: PICTURE UPLOADS --- */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Technician Picture Uploads (Supabase)</h3>
          
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-300">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
              className="text-xs text-gray-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#FE5000] hover:file:bg-orange-100 cursor-pointer flex-1"
            />
            <button
              type="button"
              onClick={handleUploadPicture}
              disabled={!uploadingFile || isUploading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FE5000] hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors shrink-0"
            >
              <Upload className="w-4 h-4" /> {isUploading ? 'Uploading...' : 'Upload Picture'}
            </button>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {files.map((file) => (
                <div key={file.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#FE5000] hover:underline truncate block">
                    {file.name}
                  </a>
                  <p className="text-[10px] text-gray-400">{file.size} • {file.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- TECHNICIAN FEATURE: COMMENTS & NOTES --- */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Technician Comments & Updates</h3>
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {comments.map((comm) => (
              <div key={comm.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                  <span className="text-gray-800 font-bold">{comm.author} <span className="text-[#FE5000]">({comm.role})</span></span>
                  <span>{comm.date}</span>
                </div>
                <p className="text-xs text-gray-700">{comm.text}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a comment or status update as technician..."
              className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#FE5000]"
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FE5000] hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Post
            </button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => alert('Task deleted')}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Delete Task
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#FE5000] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}
