import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const weeks = [
  { num: 1, title: 'The Founder Mindset & Problem Validation', deliverable: 'Problem Statement Canvas' },
  { num: 2, title: 'Customer Discovery & Market Sizing', deliverable: 'Market Sizing Worksheet' },
  { num: 3, title: 'GTM Strategy & Unit Economics', deliverable: 'GTM Plan + P&L Model' },
  { num: 4, title: 'Branding & Pricing Strategy', deliverable: 'Brand Identity + Pricing Model' },
  { num: 5, title: 'Pitch & Launch Strategy', deliverable: 'Investor Pitch Deck + Launch Plan' },
]

const S = {
  page: { minHeight:'100vh', background:'#F5EBD6', fontFamily:"'Cormorant Garamond', serif" } as React.CSSProperties,
  nav: { background:'#152B1F', padding:'20px clamp(24px,5vw,64px)', display:'flex', alignItems:'center', justifyContent:'space-between' } as React.CSSProperties,
  navBrand: { fontFamily:"'Josefin Sans', sans-serif", fontSize:'11px', fontWeight:600, letterSpacing:'0.25em', textTransform:'uppercase' as const, color:'#F5EBD6' },
  navEmail: { fontFamily:"'Josefin Sans', sans-serif", fontSize:'10px', letterSpacing:'0.15em', color:'rgba(245,235,214,0.5)' },
  hero: { background:'#213A2D', padding:'64px clamp(24px,5vw,64px)', borderBottom:'3px solid #B85A2E' } as React.CSSProperties,
  eyebrow: { fontFamily:"'Josefin Sans', sans-serif", fontSize:'10px', fontWeight:600, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'#B85A2E', marginBottom:'12px', display:'block' },
  title: { fontFamily:"'Cormorant', serif", fontWeight:300, fontSize:'clamp(36px, 6vw, 56px)', lineHeight:1.1, color:'#F5EBD6', marginBottom:'12px' },
  sub: { fontSize:'18px', color:'rgba(245,235,214,0.65)', lineHeight:1.7 },
  grid: { padding:'64px clamp(24px,5vw,64px)', display:'grid', gridTemplateColumns:'1fr', gap:'0', maxWidth:'960px' } as React.CSSProperties,
  weekRow: (unlocked: boolean): React.CSSProperties => ({
    display:'grid', gridTemplateColumns:'56px 1fr auto', gap:'28px', alignItems:'center',
    padding:'28px 0', borderBottom:'1px solid rgba(184,90,46,0.2)', opacity: unlocked ? 1 : 0.4,
  }),
  num: { fontFamily:"'Cormorant', serif", fontWeight:300, fontSize:'40px', color:'#B85A2E', lineHeight:1 },
  weekTitle: { fontFamily:"'Josefin Sans', sans-serif", fontSize:'13px', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'#213A2D', marginBottom:'4px' },
  deliverable: { fontSize:'15px', color:'#8C8880', lineHeight:1.6 },
  btn: (unlocked: boolean): React.CSSProperties => ({
    fontFamily:"'Josefin Sans', sans-serif", fontSize:'10px', fontWeight:600, letterSpacing:'0.18em',
    textTransform:'uppercase', textDecoration:'none', padding:'12px 20px',
    background: unlocked ? '#B85A2E' : '#D4BC9E', color: unlocked ? '#fff' : '#8C8880',
    whiteSpace:'nowrap', display:'block', textAlign:'center',
  }),
  lock: { fontSize:'12px', color:'#B89674', fontFamily:"'Josefin Sans', sans-serif", letterSpacing:'0.15em', textTransform:'uppercase' as const },
}

export default async function LearnPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: participant } = await supabase
    .from('participants')
    .select('weeks_unlocked, tier')
    .eq('email', user.email)
    .single()

  const weeksUnlocked = participant?.weeks_unlocked ?? 1

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <span style={S.navBrand}>The Founder's Sprint</span>
        <span style={S.navEmail}>{user.email}</span>
      </nav>

      <div style={S.hero}>
        <span style={S.eyebrow}>Your Curriculum</span>
        <h1 style={S.title}>Five focused weeks.<br /><em>Real progress every session.</em></h1>
        <p style={S.sub}>
          {participant?.tier === 'vip' ? 'VIP All-Access'
            : participant?.tier === 'oneOnOne' ? '1-on-1 Coaching'
            : participant?.tier === 'selfPaced' ? 'Self-Paced'
            : 'Group Mentoring'} &nbsp;·&nbsp; Week {weeksUnlocked} of 5 unlocked
        </p>
      </div>

      <div style={S.grid}>
        {weeks.map(w => {
          const unlocked = w.num <= weeksUnlocked
          return (
            <div key={w.num} style={S.weekRow(unlocked)}>
              <span style={S.num}>0{w.num}</span>
              <div>
                <div style={S.weekTitle}>{w.title}</div>
                <div style={S.deliverable}>Deliverable: {w.deliverable}</div>
              </div>
              {unlocked
                ? <a href={`/learn/week-${w.num}`} style={S.btn(true)}>Open →</a>
                : <span style={S.lock}>Locked</span>
              }
            </div>
          )
        })}

        {/* Resources / Toolkit — always accessible to enrolled founders */}
        <div style={{
          display:'grid', gridTemplateColumns:'56px 1fr auto', gap:'28px', alignItems:'center',
          padding:'28px 0', borderTop:'2px solid rgba(201,160,54,0.3)', marginTop:'12px',
        }}>
          <span style={{ fontFamily:"'Cormorant', serif", fontWeight:300, fontSize:'24px', color:'#C9A036', lineHeight:1, textAlign:'center' }}>◆</span>
          <div>
            <div style={S.weekTitle}>Founder's Toolkit</div>
            <div style={S.deliverable}>Resource directory, launch checklist, templates & government links</div>
          </div>
          <a href="/learn/resources" style={S.btn(true)}>Open →</a>
        </div>
      </div>
    </div>
  )
}
