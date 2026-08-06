// app/login/page.tsx
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Query the users table and capture any database errors
    const { data, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (dbError) {
      // Display the REAL error message from Supabase on the screen
      setError(`Database Error: ${dbError.message} (Hint: ${dbError.hint || 'None'})`)
      setLoading(false)
    } else if (!data) {
      setError("No user found matching that email and password.")
      setLoading(false)
    } else {
      document.cookie = `hoistec_session=${data.email}; path=/; max-age=86400; SameSite=Lax`
      
      // Role-based routing: redirect customers to their portal, admins/techs to main dashboard
      if (data.role === 'customer') {
        router.push('/customer')
      } else {
        router.push('/')
      }
      router.refresh()
    }
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
