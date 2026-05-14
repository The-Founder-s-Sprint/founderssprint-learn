'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const S = {
  page: { minHeight:'100vh', background:'#152B1F', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond', serif" } as React.CSSProperties,
  card: { background:'#F5EBD6', maxWidth:'480px', width:'100%', padding:'56px 48px', margin:'0 24px' } as React.CSSProperties,
  eyebrow: { fontFamily:"'Josefin Sans', sans-serif", fontSize:'10px', fontWeight:600, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'#B85A2E', marginBottom:'12px', display:'block' },
  title: { fontFamily:"'Cormorant', serif", fontWeight:300, fontSize:'40px', lineHeight:1.1, color:'#213A2D', marginBottom:'8px' },
  sub: { fontSize:'17px', color:'#8C8880', lineHeight:1.7, marginBottom:'40px' },
  label: { fontFamily:"'Josefin Sans', sans-serif", fontSize:'10px', fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase' as const, color:'#213A2D', display:'block', marginBottom:'8px' },
  input: { width:'100%', padding:'14px 16px', border:'2px solid #D4BC9E', background:'#FFFFFF', fontSize:'17px', fontFamily:"'Cormorant Garamond', serif", color:'#3D3B35', outline:'none', boxSizing:'border-box' as const, marginBottom:'24px' },
  btn: { width:'100%', padding:'16px', background:'#B85A2E', color:'#FFFFFF', border:'none', fontFamily:"'Josefin Sans', sans-serif", fontSize:'11px', fontWeight:600, letterSpacing:'0.22em', textTransform:'uppercase' as const, cursor:'pointer' },
  btnGhost: { width:'100%', padding:'16px', background:'transparent', color:'#213A2D', border:'2px solid #D4BC9E', fontFamily:"'Josefin Sans', sans-serif", fontSize:'11px', fontWeight:600, letterSpacing:'0.22em', textTransform:'uppercase' as const, cursor:'pointer', marginTop:'12px' },
  msg: { fontSize:'16px', lineHeight:1.7, marginTop:'24px', padding:'16px', borderLeft:'4px solid #B85A2E', background:'rgba(184,90,46,0.06)' },
  divider: { height:'1px', background:'linear-gradient(to right, transparent, #B89674, transparent)', margin:'32px 0' },
  footer: { textAlign:'center' as const, fontFamily:"'Josefin Sans', sans-serif", fontSize:'10px', letterSpacing:'0.2em', textTransform:'uppercase' as const, color:'#B89674' },
  toggle: { background:'none', border:'none', color:'#B85A2E', cursor:'pointer', fontSize:'14px', textDecoration:'underline', padding:0 },
}

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = searchParams.get('redirect') || '/learn'

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setError('Your login link has expired or is invalid. Please request a new one.')
    }
    // If redirecting to admin/coach routes, default to password mode
    if (redirectTo.startsWith('/admin') || redirectTo.startsWith('/coach')) {
      setMode('password')
    }
  }, [searchParams, redirectTo])

  // Check if already logged in
  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data: { user }}) => {
      if (user) {
        // Already authenticated — route to intended destination
        routeByRole(user)
      }
    })
  }, [])

  async function routeByRole(user: any) {
    if (redirectTo !== '/learn') {
      router.push(redirectTo)
      return
    }
    // No explicit redirect — check roles and send to the right place
    const supabase = getSupabase()
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const userRoles = (roles || []).map((r: any) => r.role)

    if (userRoles.includes('admin')) {
      router.push('/admin/dashboard')
    } else if (userRoles.includes('coach')) {
      router.push('/coach/dashboard')
    } else {
      router.push('/learn')
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/confirm` }
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      await routeByRole(data.user)
    }
    setLoading(false)
  }

  const isCoachLogin = redirectTo.startsWith('/admin') || redirectTo.startsWith('/coach')

  return (
    <div style={S.card}>
      <span style={S.eyebrow}>The Founder's Sprint</span>
      <h1 style={S.title}>
        {isCoachLogin ? <>Command<br /><em>Centre</em></> : <>Access Your<br /><em>Curriculum</em></>}
      </h1>
      <p style={S.sub}>
        {isCoachLogin
          ? 'Sign in with your coach credentials.'
          : mode === 'magic'
            ? 'Enter your enrolled email to receive a secure login link. No password required.'
            : 'Sign in with your email and password.'
        }
      </p>

      {!sent ? (
        <form onSubmit={mode === 'password' ? handlePassword : handleMagicLink}>
          <label style={S.label}>Email address</label>
          <input
            style={S.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />

          {mode === 'password' && (
            <>
              <label style={S.label}>Password</label>
              <input
                style={S.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                autoComplete="current-password"
              />
            </>
          )}

          {error && <p style={{color:'#B85A2E', fontSize:'15px', marginBottom:'16px'}}>{error}</p>}

          <button style={S.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : mode === 'password' ? 'Sign In' : 'Send Login Link'}
          </button>

          {!isCoachLogin && (
            <button
              type="button"
              style={S.btnGhost}
              onClick={() => { setMode(mode === 'magic' ? 'password' : 'magic'); setError('') }}
            >
              {mode === 'magic' ? 'Use Password Instead' : 'Use Magic Link Instead'}
            </button>
          )}
        </form>
      ) : (
        <div style={S.msg}>
          <strong>Check your inbox.</strong> A login link has been sent to <em>{email}</em>. Click it to access your curriculum — the link expires in 1 hour.
          <br /><br />
          <span style={{color:'#8C8880', fontSize:'14px'}}>Not in your inbox? Check your spam folder, or <button onClick={() => setSent(false)} style={S.toggle}>try again</button>.</span>
        </div>
      )}

      <div style={S.divider} />
      <p style={S.footer}>Five focused weeks. Real progress every session.</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div style={S.page}>
      <Suspense fallback={
        <div style={S.card}>
          <span style={{...S.eyebrow}}>The Founder's Sprint</span>
          <h1 style={S.title}>Loading...</h1>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
