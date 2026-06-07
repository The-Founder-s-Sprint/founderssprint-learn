import { NextResponse, type NextRequest } from 'next/server'

// ── RETIRED (7 June 2026) ─────────────────────────────────────────────────────
// The Founder's Sprint consolidated onto the static, themed per-role portals at
// founderssprint.co (RLS is the security boundary; the public anon key is safe
// client-side). This Next.js "curriculum" app was a second, parallel front door
// and is decommissioned: every request now redirects to the live site so old
// bookmarks (e.g. /admin/dashboard) don't 404. The Vercel project can be deleted
// entirely once traffic has drained.
export function middleware(_request: NextRequest) {
  return NextResponse.redirect('https://founderssprint.co/', 307)
}

export const config = {
  // Catch everything except Next's own static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
