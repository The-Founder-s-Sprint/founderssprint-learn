'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-browser'

// ── BRAND TOKENS (from DESIGN.md) ──────────────────────────────────────────
const T = {
  ink:       '#1A1A1A',
  inkSoft:   '#2A2826',
  inkMute:   '#5A564F',
  paper:     '#EFE7D8',
  paperDeep: '#E6DCC7',
  terra:     '#C8531F',
  terraDeep: '#9A3E16',
  ochre:     '#C9923A',
  sage:      '#8AAB5C',
  moss:      '#3D4A2E',
  stone:     '#777770',
  rule:      'rgba(26,26,26,0.18)',
}

// ── V6 MARK SVG ────────────────────────────────────────────────────────────
function V6Mark({ size = 48, onDark = true }: { size?: number; onDark?: boolean }) {
  const petals = [
    { hex: '#C8531F', opacity: 0.85, angle: 0 },
    { hex: '#C9923A', opacity: 0.80, angle: 72 },
    { hex: '#8AAB5C', opacity: 0.78, angle: 144 },
    { hex: '#3D4A2E', opacity: 0.82, angle: 216 },
    { hex: '#777770', opacity: 0.75, angle: 288 },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {petals.map((p, i) => (
        <polygon
          key={i}
          points="50,8 57,50 50,92 43,50"
          fill={p.hex}
          opacity={p.opacity}
          transform={`rotate(${p.angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="4.5" fill={onDark ? T.paper : T.ink} />
      <circle cx="50" cy="50" r="2" fill={onDark ? T.ink : T.paper} />
    </svg>
  )
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: T.ink,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    padding: '24px',
  } as React.CSSProperties,
  card: {
    background: T.paper,
    maxWidth: '440px',
    width: '100%',
    padding: '48px 40px 40px',
  } as React.CSSProperties,
  markWrap: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  } as React.CSSProperties,
  eyebrow: {
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: T.terra,
    display: 'block',
    textAlign: 'center' as const,
    marginBottom: '8px',
  } as React.CSSProperties,
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 300,
    fontSize: '38px',
    lineHeight: 1.1,
    color: T.ink,
    textAlign: 'center' as const,
    marginBottom: '6px',
  } as React.CSSProperties,
  sub: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '17px',
    color: T.inkMute,
    lineHeight: 1.7,
    textAlign: 'center' as const,
    marginBottom: '36px',
  } as React.CSSProperties,
  label: {
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: T.ink,
    display: 'block',
    marginBottom: '8px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${T.rule}`,
    background: '#FFFFFF',
    fontSize: '16px',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    color: T.ink,
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '20px',
  } as React.CSSProperties,
  btn: {
    width: '100%',
    padding: '16px',
    background: T.terra,
    color: T.paper,
    border: 'none',
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  btnGhost: {
    width: '100%',
    padding: '16px',
    background: 'transparent',
    color: T.ink,
    border: `1px solid ${T.rule}`,
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  errorBox: {
    fontSize: '15px',
    lineHeight: 1.6,
    marginBottom: '16px',
    padding: '12px 16px',
    borderLeft: `3px solid ${T.terra}`,
    background: 'rgba(200,83,31,0.06)',
    color: T.ink,
  } as React.CSSProperties,
  successBox: {
    fontSize: '16px',
    lineHeight: 1.7,
    padding: '20px',
    borderLeft: `3px solid ${T.ochre}`,
    background: 'rgba(201,146,58,0.08)',
    color: T.ink,
  } as React.CSSProperties,
  divider: {
    height: '1px',
    background: `linear-gradient(to right, transparent, ${T.rule}, transparent)`,
    margin: '28px 0',
  } as React.CSSProperties,
  footer: {
    textAlign: 'center' as const,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '14px',
    fontStyle: 'italic' as const,
    color: T.terra,
    opacity: 0.5,
  } as React.CSSProperties,
  link: {
    background: 'none',
    border: 'none',
    color: T.terra,
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    textDecoration: 'underline',
    padding: 0,
  } as React.CSSProperties,
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '-12px',
    marginBottom: '20px',
  } as React.CSSProperties,
}

// ── VIEW TYPES ──────────────────────────────────────────────────────────────
type View = 'login' | 'magic-sent' | 'reset-request' | 'reset-sent'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [view, setView] = useState<View>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = searchParams.get('redirect') || '/learn'
  const isCoachLogin = redirectTo.startsWith('/admin') || redirectTo.startsWith('/coach')

  // Auto-detect mode from redirect path
  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setError('Your login link has expired or is invalid. Please request a new one.')
    }
    if (isCoachLogin) {
      setMode('password')
    }
  }, [searchParams, isCoachLogin])

  // Check if already logged in
  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) routeByRole(user)
    })
  }, [])

  async function routeByRole(user: any) {
    if (redirectTo !== '/learn') {
      router.push(redirectTo)
      return
    }
    const supabase = getSupabase()
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const userRoles = (roles || []).map((r: any) => r.role)
    if (userRoles.includes('admin')) router.push('/admin/dashboard')
    else if (userRoles.includes('coach')) router.push('/coach/dashboard')
    else router.push('/learn')
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/confirm` },
    })
    if (error) {
      setError(friendlyError(error.message))
    } else {
      setView('magic-sent')
    }
    setLoading(false)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(friendlyError(error.message))
      setLoading(false)
      return
    }
    if (data.user) await routeByRole(data.user)
    setLoading(false)
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback`,
    })
    if (error) {
      setError(friendlyError(error.message))
    } else {
      setView('reset-sent')
    }
    setLoading(false)
  }

  function friendlyError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Incorrect email or password. Please try again.'
    if (msg.includes('Email not confirmed')) return 'Your email address has not been confirmed. Check your inbox for a confirmation link.'
    if (msg.includes('rate limit') || msg.includes('too many requests')) return 'Too many attempts. Please wait a minute and try again.'
    if (msg.includes('User not found')) return 'No account found with this email address.'
    if (msg.includes('already registered')) return 'This email is already registered. Try signing in instead.'
    return msg
  }

  // ── MAGIC LINK SENT ───────────────────────────────────────────────────────
  if (view === 'magic-sent') {
    return (
      <div style={S.card}>
        <div style={S.markWrap}><V6Mark size={44} onDark={false} /></div>
        <span style={S.eyebrow}>The Founder's Sprint</span>
        <h1 style={S.title}>Check Your<br /><em>Inbox</em></h1>
        <div style={S.successBox}>
          A login link has been sent to <strong>{email}</strong>. Click it to access your curriculum — the link expires in 1 hour.
          <br /><br />
          <span style={{ color: T.inkMute, fontSize: '14px' }}>
            Not in your inbox? Check your spam folder, or{' '}
            <button onClick={() => { setView('login'); setError('') }} style={S.link}>try again</button>.
          </span>
        </div>
        <div style={S.divider} />
        <p style={S.footer}>Build with direction.</p>
      </div>
    )
  }

  // ── PASSWORD RESET SENT ───────────────────────────────────────────────────
  if (view === 'reset-sent') {
    return (
      <div style={S.card}>
        <div style={S.markWrap}><V6Mark size={44} onDark={false} /></div>
        <span style={S.eyebrow}>The Founder's Sprint</span>
        <h1 style={S.title}>Reset Link<br /><em>Sent</em></h1>
        <div style={S.successBox}>
          If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly. Check your inbox and spam folder.
        </div>
        <div style={{ marginTop: '24px' }}>
          <button
            style={S.btnGhost}
            onClick={() => { setView('login'); setMode('password'); setError('') }}
          >
            Back to Sign In
          </button>
        </div>
        <div style={S.divider} />
        <p style={S.footer}>Build with direction.</p>
      </div>
    )
  }

  // ── PASSWORD RESET REQUEST ────────────────────────────────────────────────
  if (view === 'reset-request') {
    return (
      <div style={S.card}>
        <div style={S.markWrap}><V6Mark size={44} onDark={false} /></div>
        <span style={S.eyebrow}>The Founder's Sprint</span>
        <h1 style={S.title}>Reset Your<br /><em>Password</em></h1>
        <p style={S.sub}>
          Enter your email and we'll send you a link to create a new password.
        </p>

        <form onSubmit={handleResetRequest}>
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

          {error && <div style={S.errorBox}>{error}</div>}

          <button style={S.btn} type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <button
            type="button"
            style={S.btnGhost}
            onClick={() => { setView('login'); setError('') }}
          >
            Back to Sign In
          </button>
        </form>

        <div style={S.divider} />
        <p style={S.footer}>Build with direction.</p>
      </div>
    )
  }

  // ── MAIN LOGIN FORM ───────────────────────────────────────────────────────
  return (
    <div style={S.card}>
      <div style={S.markWrap}><V6Mark size={44} onDark={false} /></div>
      <span style={S.eyebrow}>The Founder's Sprint</span>
      <h1 style={S.title}>
        {isCoachLogin ? <>Command<br /><em>Centre</em></> : <>Access Your<br /><em>Curriculum</em></>}
      </h1>
      <p style={S.sub}>
        {isCoachLogin
          ? 'Sign in with your coach credentials.'
          : mode === 'magic'
            ? 'Enter your enrolled email to receive a secure login link.'
            : 'Sign in with your email and password.'
        }
      </p>

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
            <div style={S.forgotRow}>
              <button
                type="button"
                style={S.link}
                onClick={() => { setView('reset-request'); setError('') }}
              >
                Forgot password?
              </button>
            </div>
          </>
        )}

        {error && <div style={S.errorBox}>{error}</div>}

        <button
          style={S.btn}
          type="submit"
          disabled={loading}
          onMouseOver={e => (e.currentTarget.style.background = T.terraDeep)}
          onMouseOut={e => (e.currentTarget.style.background = T.terra)}
        >
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

      <div style={S.divider} />
      <p style={S.footer}>Build with direction.</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        input:focus { border-color: ${T.terra} !important; }
        ::placeholder { color: ${T.stone}; opacity: 0.6; }
      `}</style>
      <div style={S.page}>
        <Suspense fallback={
          <div style={S.card}>
            <div style={S.markWrap}><V6Mark size={44} onDark={false} /></div>
            <span style={S.eyebrow}>The Founder's Sprint</span>
            <h1 style={S.title}>Loading...</h1>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </>
  )
}
