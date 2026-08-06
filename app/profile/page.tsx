// app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchUserData() {
      const match = document.cookie.match(new RegExp('(^| )hoistec_session=([^;]+)'))
      if (!match) return
      const userEmail = decodeURIComponent(match[2])

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single()

      if (data) {
        setEmail(data.email)
        setName(data.name || '')
        setPhone(data.phone || '')
        setRole(data.role || 'customer')
        setAvatarUrl(data.avatar_url || null)
      }
      setLoading(false)
    }
    fetchUserData()
  }, [supabase])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setError(null)

      if (!e.target.files || e.target.files.length === 0) {
        return
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload image to Supabase Storage 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const newAvatarUrl = publicUrlData.publicUrl

      // Save URL to users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ avatar_url: newAvatarUrl })
        .eq('email', email)

      if (dbError) throw dbError

      setAvatarUrl(newAvatarUrl)
      setMessage('Profile picture updated successfully!')
    } catch (err: any) {
      setError(`Error uploading image: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)

    const updateData: { name: string; phone: string; password?: string } = {
      name,
      phone,
    }

    if (password.trim() !== '') {
      updateData.password = password
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', email)

    if (updateError) {
      setError(`Failed to update profile: ${updateError.message}`)
    } else {
      setMessage('Profile info updated successfully!')
      setPassword('')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-gray-600">Loading profile...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile & Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your account information, profile image, and credentials.</p>

      {message && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded">{message}</div>}
      {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded">{error}</div>}

      {/* Avatar Upload Section */}
      <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-500 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-orange-600 uppercase">
              {email ? email.charAt(0) : 'U'}
            </span>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Profile Picture</label>
          <p className="text-xs text-gray-500 mb-3">Upload a PNG, JPG, or WEBP image.</p>
          <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition-colors inline-block">
            {uploading ? 'Uploading...' : 'Choose Image'}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email Address (Read-only)</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">System Role</label>
          <input
            type="text"
            value={role.toUpperCase()}
            disabled
            className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-orange-600 font-semibold cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +46 70 123 4567"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 font-bold text-white bg-orange-600 rounded hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  )
}
