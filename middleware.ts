import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Route → required role mapping ─────────────────────────────────────────────
const ROLE_ROUTES: Record<string, string> = {
  '/admin':    'admin',
  '/coach':    'coach',
  '/founder':  'founder',
  '/investor': 'investor',
}

// Public routes that never require auth
const PUBLIC_PATHS = ['/login', '/auth', '/not-enrolled', '/unauthorized']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  // Skip public routes
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return supabaseResponse
  }

  // ── Create Supabase client with cookie handling ─────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  // ── Refresh session ─────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  // ── /learn routes: participant-based access (existing logic) ─────────────
  if (pathname.startsWith('/learn')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('weeks_unlocked, tier')
      .eq('email', user.email)
      .single()

    if (!participant) {
      return NextResponse.redirect(new URL('/not-enrolled', request.url))
    }

    const weekMatch = pathname.match(/\/learn\/week-(\d+)/)
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1])
      if (weekNum > participant.weeks_unlocked) {
        return NextResponse.redirect(new URL('/learn', request.url))
      }
    }

    supabaseResponse.headers.set('x-participant-tier', participant.tier || 'group')
    supabaseResponse.headers.set('x-participant-weeks', String(participant.weeks_unlocked))
    return supabaseResponse
  }

  // ── Role-gated routes: /admin, /coach, /founder, /investor ──────────────
  const rolePrefix = Object.keys(ROLE_ROUTES).find(prefix => pathname.startsWith(prefix))

  if (rolePrefix) {
    // Must be logged in
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check role
    const requiredRole = ROLE_ROUTES[rolePrefix]
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const userRoles = (roles || []).map(r => r.role)

    if (!userRoles.includes(requiredRole)) {
      // Special case: admin can access coach routes too
      if (requiredRole === 'coach' && userRoles.includes('admin')) {
        // Allow — admins have implicit coach access
      } else {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Pass role info to the page via headers
    supabaseResponse.headers.set('x-user-roles', userRoles.join(','))
    supabaseResponse.headers.set('x-user-email', user.email || '')
    supabaseResponse.headers.set('x-user-id', user.id)
    supabaseResponse.headers.set('x-user-name', user.user_metadata?.full_name || user.email || '')
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/learn/:path*',
    '/admin/:path*',
    '/coach/:path*',
    '/founder/:path*',
    '/investor/:path*',
    '/login',
    '/unauthorized',
  ],
}
