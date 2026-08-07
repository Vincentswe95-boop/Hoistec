// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserRole, syncUserWithAuthTable } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let authData
    let authError

    ;({ data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    }))

    if (authError || !authData?.user) {
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError || !signUpData.user) {
          setError(signUpError?.message || authError?.message || 'Invalid email or password.')
          setLoading(false)
          return
        }

        authData = signUpData
      } catch (signUpException: any) {
        setError(signUpException?.message || 'Unable to sign in with Supabase Auth.')
        setLoading(false)
        return
      }
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Hoistec Management</h1>
        
        {error && (
          <div className="p-3 mb-4 text-xs text-red-700 bg-red-100 rounded break-words">
            {error}
          </div>
        )}

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
        </form>
      </div>
    </div>
  )
}
