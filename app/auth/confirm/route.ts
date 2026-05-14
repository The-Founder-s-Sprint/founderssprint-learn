import { type EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')

  console.log('[auth/confirm] token_hash:', !!token_hash, 'type:', type, 'code:', !!code)

  const redirectTo = new URL('/learn', origin)
  const response = NextResponse.redirect(redirectTo)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as any)
          })
        },
      },
    }
  )

  // Strategy 1: PKCE code exchange (if Supabase redirected with a code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/confirm] PKCE exchange:', error ? `ERROR: ${error.message}` : 'SUCCESS')
    if (!error) {
      return response
    }
    // If PKCE fails (missing code verifier), fall through to token_hash
    console.log('[auth/confirm] PKCE failed, trying token_hash fallback...')
  }

  // Strategy 2: Direct token_hash verification (stateless, no cookie needed)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    console.log('[auth/confirm] verifyOtp:', error ? `ERROR: ${error.message}` : 'SUCCESS')
    if (!error) {
      return response
    }
  }

  // Both strategies failed
  console.log('[auth/confirm] All auth strategies failed, redirecting to login')
  const loginUrl = new URL('/login?error=auth_failed', origin)
  return NextResponse.redirect(loginUrl)
}
