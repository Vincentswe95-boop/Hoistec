import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from '@/context/UserContext'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'Hoistec - Construction Hoist Management',
  description: 'Manage construction hoists, schedules, and repairs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </UserProvider>
      </body>
    </html>
  )
}