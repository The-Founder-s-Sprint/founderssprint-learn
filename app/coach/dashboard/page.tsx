'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Coach Dashboard — Phase 1 Bridge
 *
 * Coaches and admins share the same dashboard UI for now (the Coaches tab
 * in dashboard.html handles role-specific display based on reviewerEmail).
 *
 * Phase 2: this becomes a dedicated coach view with only their sessions,
 * earnings, content management, and application review panel.
 */

export default function CoachDashboard() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user }}) => {
      if (user) setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0B1810', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Josefin Sans', sans-serif", color: '#8C8880'
      }}>
        Loading Coach Dashboard...
      </div>
    )
  }

  // Phase 1: dashboard.html in Next.js public/ (same origin, shared cookies).
  // Coach sees it filtered by their session — reviewer-aware display.
  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0 }}>
      <iframe
        src="/dashboard.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Coach Dashboard"
        allow="clipboard-write"
      />
    </div>
  )
}
