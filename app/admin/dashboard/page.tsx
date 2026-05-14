import { headers } from 'next/headers'
import AdminDashboard from './AdminDashboard'

/**
 * Admin Dashboard — Server Component
 *
 * Middleware has already verified the Supabase session and admin role
 * BEFORE this page renders. We read the user info from middleware-injected
 * headers and pass it to the client-side AdminDashboard component.
 */
export default async function AdminDashboardPage() {
  const h = headers()
  const userEmail = h.get('x-user-email') || ''
  const userName = h.get('x-user-name') || userEmail
  const userId = h.get('x-user-id') || ''
  const userRoles = (h.get('x-user-roles') || '').split(',').filter(Boolean)

  return (
    <AdminDashboard
      userEmail={userEmail}
      userName={userName}
      userId={userId}
      userRoles={userRoles}
    />
  )
}
