'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    setIsRecoveryMode(params.get('type') === 'recovery')
  }, [])

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('Password updated successfully. You can now sign in with your new password.')
    setNewPassword('')
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Reset Your Password</h1>

        {error && (
          <div className="p-3 mb-4 text-xs text-red-700 bg-red-100 rounded break-words">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 mb-4 text-xs text-green-700 bg-green-100 rounded break-words">
            {message}
          </div>
        )}

        {isRecoveryMode ? (
          <form onSubmit={handleSetNewPassword} className="flex flex-col gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 mt-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? 'Saving new password...' : 'Set New Password'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-sm text-gray-600">
            <p>The reset link is invalid or missing the required recovery token.</p>
            <p>Please go back to the login page and request a new password reset email.</p>
            <Link href="/login" className="block text-center text-blue-600 font-semibold hover:text-blue-800">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
