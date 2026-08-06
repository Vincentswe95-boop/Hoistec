// components/PushNotificationManager.tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushNotificationManager() {
  const [subscribed, setSubscribed] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function setupPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        let subscription = await registration.pushManager.getSubscription()

        if (!subscription && publicVapidKey) {
          // Prompt user for notification permissions
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            })

            // Get logged-in user email
            const match = document.cookie.match(new RegExp('(^| )hoistec_session=([^;]+)'))
            if (match) {
              const email = decodeURIComponent(match[2])
              await supabase.from('push_subscriptions').upsert([
                { email, subscription: JSON.stringify(subscription) }
              ], { onConflict: 'email' })
            }
          }
        }
        if (subscription) setSubscribed(true)
      } catch (err) {
        console.error('Push notification setup error:', err)
      }
    }
    setupPush()
  }, [supabase])

  return null // Runs silently in the background of the dashboard layout
}
