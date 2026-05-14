import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check roles and route to the right dashboard
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = (roles || []).map(r => r.role)

  if (userRoles.includes('admin')) redirect('/admin/dashboard')
  if (userRoles.includes('coach')) redirect('/coach/dashboard')
  if (userRoles.includes('investor')) redirect('/investor')
  if (userRoles.includes('founder')) redirect('/founder')

  // Default: curriculum (for participants without a role entry)
  redirect('/learn')
}
