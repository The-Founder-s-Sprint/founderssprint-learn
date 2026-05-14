import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Log what we received for debugging
  const allCookies = request.cookies.getAll()
  console.log('[auth/callback] code present:', !!code)
  console.log('[auth/callback] cookies:', allCookies.map(c => c.name).join(', '))

  if (code) {
    // Create the redirect response FIRST so we can set cookies on it
    const redirectUrl = new URL('/learn', origin)
    const response = NextResponse.redirect(redirectUrl)

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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[auth/callback] exchange result:', error ? `ERROR: ${error.message}` : 'SUCCESS')

    if (!error) {
      return response
    }
  }

  // Auth failed — redirect to login
  const loginUrl = new URL('/login?error=auth_failed', origin)
  return NextResponse.redirect(loginUrl)
}
