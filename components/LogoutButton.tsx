// components/LogoutButton.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // Clear the custom project session cookie
    document.cookie = 'hoistec_session=; path=/; max-age=0;'
    router.refresh()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700"
    >
      Sign Out
    </button>
  )
}
