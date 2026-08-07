// app/repairs/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Calendar, Clock, Wrench, User, FileText, Download, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RepairDetailPage() {
  const router = useRouter();
  const params = useParams();
  const repairId = params.id;

  const [repair, setRepair] = useState<any>(null);
  const [hoist, setHoist] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (repairId) {
      fetchRepairDetails();
    }
  }, [repairId]);

  async function fetchRepairDetails() {
    try {
      setLoading(true);
      const { data: repairData, error: repairError } = await supabase
        .from('repairs')
        .select('*')
        .eq('id', repairId)
        .single();

      if (repairError) throw repairError;
      setRepair(repairData);

      if (repairData?.hoist_id) {
        const { data: hoistData } = await supabase
          .from('hoists')
          .select('*')
          .eq('id', repairData.hoist_id)
          .single();
        if (hoistData) setHoist(hoistData);
      }

      const { data: commentsData } = await supabase
        .from('job_comments')
        .select('*')
        .eq('repair_id', repairId)
        .order('created_at', { ascending: false });
      
      if (commentsData) setComments(commentsData);

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase.from('job_comments').insert([
        {
          repair_id: Number(repairId),
          comment: newComment,
          author: 'Admin User',
          role: 'admin',
        }
      ]);

      if (error) throw error;
      setNewComment('');
      fetchRepairDetails();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center text-gray-500 font-medium">
        Loading task details...
      </div>
    );
  }

  if (errorMsg || !repair) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl text-gray-700 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
          {errorMsg || 'Task not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl text-gray-700 cursor-pointer transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Task: {repair.repair_no || `Task #${repair.id}`}
              </h1>
              <span className={`px-3 py-1 font-extrabold rounded-full text-xs shadow-xs ${
                repair.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-[#FE5000]'
              }`}>
                {repair.status || 'Scheduled'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">Detailed overview and logs for this service order</p>
          </div>
        </div>

        <button
          onClick={() => router.push(`/repairs/${repair.id}/edit`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FE5000] hover:bg-orange-600 text-white font-bold rounded-2xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          <Edit className="w-4 h-4" /> Edit Task
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
          <div>
            <span className="block text-gray-400 font-bold uppercase tracking-wider mb-1">Associated Hoist</span>
            <div className="text-sm font-extrabold text-gray-900">
              {hoist ? `Individual No: ${hoist.individual_number || 'N/A'} | Serial No: ${hoist.serial_number || 'N/A'} (${hoist.model || ''})` : `Hoist ID: ${repair.hoist_id}`}
            </div>
            {hoist?.current_site && (
              <div className="text-gray-500 font-medium mt-1">Current Site: {hoist.current_site}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-gray-400 font-bold uppercase tracking-wider mb-1">Date</span>
              <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                <Calendar className="w-4 h-4 text-[#FE5000]" /> {repair.date}
              </div>
            </div>
            <div>
              <span className="block text-gray-400 font-bold uppercase tracking-wider mb-1">Type</span>
              <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                <Wrench className="w-4 h-4 text-[#FE5000]" /> {repair.type}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-100">
          <div>
            <span className="block text-gray-400 font-bold uppercase tracking-wider mb-1">Assigned Technician</span>
            <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
              <User className="w-4 h-4 text-[#FE5000]" /> {repair.technician || 'Unassigned'}
            </div>
          </div>
          <div>
            <span className="block text-gray-400 font-bold uppercase tracking-wider mb-1">Estimated Hours</span>
            <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
              <Clock className="w-4 h-4 text-[#FE5000]" /> {repair.hours || 0} hrs
            </div>
          </div>
          <div>
            <span className="block text-gray-400 font-bold uppercase tracking-wider mb-1">Parts Needed</span>
            <div className="font-bold text-gray-800 text-sm">
              {repair.parts || 'None specified'}
            </div>
          </div>
        </div>

        <div>
          <span className="block text-gray-400 font-bold uppercase tracking-wider mb-2">Description / Work Performed</span>
          <div className="p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
            {repair.description || 'No description provided.'}
          </div>
        </div>

        {repair.file_url && (
          <div>
            <span className="block text-gray-400 font-bold uppercase tracking-wider mb-2">Attached Document</span>
            <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-2xl text-orange-900 font-medium">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FE5000]" />
                <span className="truncate">View attached file</span>
              </div>
              <a
                href={repair.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-[#FE5000] text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Open / Download
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#FE5000]" /> Technician Comments & Updates
        </h3>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-400 font-medium">No comments or updates logged yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-4 bg-gray-50 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">{c.author || 'User'} <span className="text-[#FE5000]">({c.role || 'technician'})</span></span>
                  <span className="text-gray-400 text-[10px]">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-700 font-medium">{c.comment}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddComment} className="flex gap-3 pt-4 border-t border-gray-100">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or update..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 outline-none focus:border-[#FE5000] focus:bg-white transition-all"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#FE5000] hover:bg-orange-600 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Post Update
          </button>
        </form>
      </div>
    </div>
  );
}
