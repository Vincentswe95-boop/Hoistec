// app/login/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserRole, syncUserWithAuthTable } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    setIsRecoveryMode(params.get('type') === 'recovery')
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData?.user) {
      setError(authError?.message || 'Invalid email or password. If you recently changed your password, use the reset option below.')
      setLoading(false)
      return
    }

    const role = await getUserRole()
    const emailToSync = authData?.user?.email ?? email

    if (emailToSync) {
      await syncUserWithAuthTable(emailToSync, role ?? undefined)
    }

    if (role === 'customer') {
      router.push('/customer')
    } else {
      router.push('/')
    }
    router.refresh()
  }

  const handlePasswordResetRequest = async () => {
    if (!email) {
      setError('Please enter your email so we can send a reset link.')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('A password reset email has been sent. Open it and follow the link to choose a new password.')
    }

    setLoading(false)
  }

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

    setMessage('Password updated successfully. You can sign in with your new password now.')
    setNewPassword('')
    setIsRecoveryMode(false)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Hoistec Management</h1>

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
              {loading ? 'Updating password...' : 'Set New Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 mt-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={handlePasswordResetRequest}
              disabled={loading}
              className="w-full py-2 text-sm font-semibold text-blue-600 underline hover:text-blue-800 disabled:text-blue-300"
            >
              {loading ? 'Sending reset email...' : 'Forgot password?'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
