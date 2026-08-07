// components/JobComments.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Comment {
  id: number
  author_name: string
  comment: string
  attachment_url: string | null
  attachment_type: string | null
  created_at: string
}

export default function JobComments({ jobId }: { jobId: number }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchComments = async () => {
    const { data } = await supabase
      .from('job_comments')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  useEffect(() => {
    fetchComments()
  }, [jobId])

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() && !file) return
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    const userEmail = session?.user?.email || 'Unknown'

    // Fetch user's real name
    const { data: userData } = await supabase.from('users').select('name').eq('email', userEmail).single()
    const authorName = userData?.name || userEmail

    let attachmentUrl = null
    let attachmentType = null

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `job_${jobId}_${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file) // Reusing storage bucket or create a 'job-docs' bucket
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        attachmentUrl = urlData.publicUrl
        attachmentType = file.type.includes('image') ? 'image' : 'document'
      }
    }

    await supabase.from('job_comments').insert([
      {
        job_id: jobId,
        author_email: userEmail,
        author_name: authorName,
        comment: newComment,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      }
    ])

    setNewComment('')
    setFile(null)
    setLoading(false)
    fetchComments()
  }

  return (
    <div className="space-y-4 mt-6 p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-md font-bold text-gray-800">Job Activity & Comments</h3>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="p-3 bg-gray-50 rounded border border-gray-100 text-sm">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="font-semibold text-orange-600">{c.author_name}</span>
              <span>{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <p className="text-gray-800">{c.comment}</p>
            {c.attachment_url && (
              <div className="mt-2">
                {c.attachment_type === 'image' ? (
                  <img src={c.attachment_url} alt="Attachment" className="w-32 h-32 object-cover rounded border" />
                ) : (
                  <a href={c.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline font-medium">
                    📄 View Attached Document
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handlePostComment} className="space-y-3 pt-3 border-t border-gray-100">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment, note, or update..."
          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
          rows={2}
        />
        <div className="flex items-center justify-between">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs text-gray-500" />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-orange-600 text-white text-xs font-bold rounded hover:bg-orange-700 transition-colors"
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  )
}
