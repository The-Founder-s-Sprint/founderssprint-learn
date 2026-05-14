'use client'
import { createBrowserClient } from '@supabase/ssr'

const S = {
  page: { minHeight:'100vh', background:'#152B1F', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond', serif" } as React.CSSProperties,
  card: { background:'#F5EBD6', maxWidth:'480px', width:'100%', padding:'56px 48px', margin:'0 24px' } as React.CSSProperties,
  eyebrow: { fontFamily:"'Josefin Sans', sans-serif", fontSize:'10px', fontWeight:600, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'#B85A2E', marginBottom:'12px', display:'block' },
  title: { fontFamily:"'Cormorant', serif", fontWeight:300, fontSize:'36px', lineHeight:1.1, color:'#213A2D', marginBottom:'8px' },
  sub: { fontSize:'17px', color:'#8C8880', lineHeight:1.7, marginBottom:'32px' },
  btn: { padding:'14px 32px', background:'#B85A2E', color:'#FFFFFF', border:'none', fontFamily:"'Josefin Sans', sans-serif", fontSize:'11px', fontWeight:600, letterSpacing:'0.22em', textTransform:'uppercase' as const, cursor:'pointer', marginRight:'12px' },
  btnGhost: { padding:'14px 32px', background:'transparent', color:'#213A2D', border:'2px solid #D4BC9E', fontFamily:"'Josefin Sans', sans-serif", fontSize:'11px', fontWeight:600, letterSpacing:'0.22em', textTransform:'uppercase' as const, cursor:'pointer' },
}

export default function UnauthorizedPage() {
  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <span style={S.eyebrow}>The Founder's Sprint</span>
        <h1 style={S.title}>Access<br /><em>Restricted</em></h1>
        <p style={S.sub}>
          Your account doesn't have permission to access this area.
          If you believe this is an error, contact the admin team.
        </p>
        <div>
          <button style={S.btn} onClick={() => window.location.href = '/'}>
            Go Home
          </button>
          <button style={S.btnGhost} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
