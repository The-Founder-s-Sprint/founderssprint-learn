import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default async function ResourcesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: '#152B1F',
        padding: '12px clamp(16px, 3vw, 40px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        borderBottom: '2px solid #B85A2E',
      }}>
        <a href="/learn" style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(245,235,214,0.6)',
          textDecoration: 'none',
        }}>← All Weeks</a>
        <span style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#B85A2E',
        }}>Founder's Toolkit</span>
        <span style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: '10px',
          color: 'rgba(245,235,214,0.4)',
          letterSpacing: '0.1em',
        }}>{user.email}</span>
      </div>
      <iframe
        src="/modules/resources.html"
        style={{ flex: 1, border: 'none', width: '100%' }}
        title="Founder's Toolkit — Resources, Templates & Directory"
      />
    </div>
  )
}
