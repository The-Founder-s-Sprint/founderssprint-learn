import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default async function Week1Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: participant } = await supabase
    .from('participants')
    .select('tier')
    .eq('email', user.email)
    .single()
  const tier = participant?.tier || 'group'

  // Fetch published presentations for week 1
  const { data: materials } = await supabase
    .from('course_materials')
    .select('id, title, description, file_path, source_url, module_type, format, duration_minutes')
    .eq('week_number', 1)
    .eq('is_active', true)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  const presentations = (materials || []).filter(
    (m) => m.module_type === 'presentation' || m.format === 'html_native'
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
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
        }}>Week 1 — Mindset & Problem Validation</span>
        <span style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: '10px',
          color: 'rgba(245,235,214,0.4)',
          letterSpacing: '0.1em',
        }}>{user.email}</span>
      </div>

      {/* Presentations bar — only renders if presentations exist */}
      {presentations.length > 0 && (
        <div style={{
          background: '#1A201E',
          padding: '10px clamp(16px, 3vw, 40px)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(201,146,58,0.15)',
        }}>
          <span style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#C9923A',
            flexShrink: 0,
          }}>Presentations</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {presentations.map((p) => {
              const src = p.file_path || p.source_url || ''
              const viewerUrl = `/presentation-viewer.html?src=${encodeURIComponent(src)}&title=${encodeURIComponent(p.title)}`
              return (
                <a
                  key={p.id}
                  href={viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "'Josefin Sans', sans-serif",
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    padding: '6px 16px',
                    background: 'rgba(201,146,58,0.12)',
                    color: '#EFE7D8',
                    border: '1px solid rgba(201,146,58,0.25)',
                    transition: 'all 0.2s',
                  }}
                  title={p.description || p.title}
                >
                  ▶ {p.title}
                  {p.duration_minutes ? (
                    <span style={{ color: 'rgba(239,231,216,0.4)', marginLeft: '8px', fontWeight: 400 }}>
                      {p.duration_minutes} min
                    </span>
                  ) : null}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Module iframe */}
      <iframe
        src={`/modules/week-1.html?tier=${tier}`}
        style={{ flex: 1, border: 'none', width: '100%' }}
        title="Week 1: The Founder Mindset & Problem Validation"
      />
    </div>
  )
}
