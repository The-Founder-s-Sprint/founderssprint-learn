import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default async function Week2Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: participant } = await supabase
    .from('participants')
    .select('tier')
    .eq('email', user.email)
    .single()
  const tier = participant?.tier || 'group'

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
        }}>Week 2 — Customer Discovery & Market Sizing</span>
        <span style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: '10px',
          color: 'rgba(245,235,214,0.4)',
          letterSpacing: '0.1em',
        }}>{user.email}</span>
      </div>
      <iframe
        src={`/modules/week-2.html?tier=${tier}`}
        style={{ flex: 1, border: 'none', width: '100%' }}
        title="Week 2: Customer Discovery & Market Sizing"
      />
    </div>
  )
}
