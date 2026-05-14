'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase-browser'

// ── BRAND TOKENS (from DESIGN.md) ───────────────────────────────────────────
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
  success:   '#0A8F64',
  danger:    '#DC3545',
  warning:   '#C47F08',
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://founders-sprint-api.vercel.app'

// ── TYPES ────────────────────────────────────────────────────────────────────
interface Registration {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  sector?: string
  track: string
  cohort_id: number
  deposit_amount: number
  balance_amount: number
  full_fee: number
  deposit_paid: boolean
  balance_paid: boolean
  forfeited: boolean
  admin_note?: string
  created_at: string
}

interface Cohort {
  id: number
  name: string
  status: string
}

interface PaymentRequest {
  id: number
  registration_id: number
  payment_type: string
  status: string
}

interface Document {
  id: number
  name: string
  description?: string
  category: string
  cohort_id?: number
  storage_path: string
  file_size?: number
  mime_type?: string
  created_at: string
}

interface CoachApp {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  country_code?: string
  headline?: string
  bio?: string
  experience?: string
  notable_clients?: string
  coaching_philosophy?: string
  taxonomy_l1?: string
  taxonomy_l2?: string[]
  taxonomy_l3?: string[]
  session_types?: string[]
  time_slots?: string[]
  assigned_day?: string
  geographies?: string
  current_role?: string
  has_existing_materials?: string
  linkedin_url?: string
  twitter_url?: string
  instagram_url?: string
  website_url?: string
  status: string
  votes?: Vote[]
  required_approvals?: number
  admin_notes?: string
  rejection_reason?: string
  created_at?: string
}

interface Vote {
  reviewer_email: string
  reviewer_name?: string
  vote: string
  rejection_reason?: string
  created_at?: string
}

interface Coach {
  id: number
  first_name: string
  last_name: string
  email: string
  founderssprint_email?: string
  sector_l1?: string
  role: string
  status: string
}

interface Provider {
  id: string
  company_name: string
  category: string
  description?: string
  contact_name?: string
  email?: string
  phone?: string
  website?: string
  tier: string
  price_ugx: number
  position: number
  featured: boolean
  status: string
  starts_at: string
  expires_at: string
}

interface DirApplication {
  id: string
  company_name: string
  email: string
  phone?: string
  contact_name: string
  category: string
  preferred_tier: string
  website?: string
  status: string
  reviewed_at?: string
  created_at: string
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function fmtUGX(n: number | null | undefined): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `UGX ${(n / 1_000).toFixed(0)}K`
  return `UGX ${n.toLocaleString()}`
}

function fmtDate(ts: string | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function esc(str: string | null | undefined): string {
  return str ? String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''
}

const CATEGORY_LABELS: Record<string, string> = {
  legal: 'Legal & Corporate',
  accounting: 'Accounting & Audit',
  design: 'Graphic Design & Branding',
  unbs: 'UNBS & Standards',
  banking: 'Banking & Finance',
  insurance: 'Insurance',
  ip: 'IP & Trademark',
  digital: 'Digital & Web Development',
}

const L1_LABELS: Record<string, string> = {
  marketing_branding:   'Marketing & Branding',
  financial_modelling:  'Financial Modelling & Business Finance',
  strategy_team:        'Strategy & Team Building',
  investment_readiness: 'Investment Readiness & Fundraising',
  product_development:  'Product Development & Pricing',
}

// ── V6 MARK COMPONENT ────────────────────────────────────────────────────────
function V6Mark({ size = 32, onDark = true }: { size?: number; onDark?: boolean }) {
  const petals = [
    { color: '#C8531F', opacity: 0.85, rotation: 0 },
    { color: '#C9923A', opacity: 0.80, rotation: 72 },
    { color: '#8AAB5C', opacity: 0.78, rotation: 144 },
    { color: '#3D4A2E', opacity: 0.82, rotation: 216 },
    { color: '#777770', opacity: 0.75, rotation: 288 },
  ]
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {petals.map((p, i) => (
        <polygon
          key={i}
          points="50,8 57,50 50,92 43,50"
          fill={p.color}
          opacity={p.opacity}
          transform={`rotate(${p.rotation} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="4.5" fill={onDark ? T.paper : T.ink} />
      <circle cx="50" cy="50" r="2" fill={onDark ? T.ink : T.paper} />
    </svg>
  )
}

// ── TAB DEFINITIONS ──────────────────────────────────────────────────────────
type TabName = 'overview' | 'registrations' | 'revenue' | 'documents' | 'directory' | 'coaches'

const TABS: { id: TabName; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'registrations', label: 'Registrations' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'documents', label: 'Documents' },
  { id: 'directory', label: 'Directory' },
  { id: 'coaches', label: 'Coaches' },
]

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface Props {
  userEmail: string
  userName: string
  userId: string
  userRoles: string[]
}

export default function AdminDashboard({ userEmail, userName, userId, userRoles }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('overview')
  const [loading, setLoading] = useState(true)

  // Core data
  const [regs, setRegs] = useState<Registration[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [docs, setDocs] = useState<Document[]>([])
  const [payReqs, setPayReqs] = useState<PaymentRequest[]>([])

  // Lazy-loaded data
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [coachApps, setCoachApps] = useState<CoachApp[]>([])
  const [coachAppsLoaded, setCoachAppsLoaded] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [dirApps, setDirApps] = useState<DirApplication[]>([])
  const [directoryLoaded, setDirectoryLoaded] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const toastTimer = useRef<NodeJS.Timeout>()

  function showToast(msg: string, type = 'info') {
    setToast({ msg, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // ── Load core data ─────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    const sb = getSupabase()
    const [{ data: r }, { data: c }, { data: d }, { data: p }] = await Promise.all([
      sb.from('registrations').select('*').order('created_at', { ascending: false }),
      sb.from('cohorts').select('*').order('id'),
      sb.from('documents').select('*').order('created_at', { ascending: false }),
      sb.from('payment_requests').select('*').eq('status', 'success'),
    ])
    setRegs(r || [])
    setCohorts(c || [])
    setDocs(d || [])
    setPayReqs(p || [])
    setLoading(false)

    // Also load coaches for meeting invite
    const { data: coaches } = await sb
      .from('coaches')
      .select('id, first_name, last_name, email, sector_l1, founderssprint_email, role, status')
      .eq('role', 'coach')
      .eq('status', 'active')
      .order('id')
    setCoaches(coaches || [])
  }, [])

  useEffect(() => { loadAllData() }, [loadAllData])

  // ── Lazy load directory data ───────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'directory' && !directoryLoaded) {
      const sb = getSupabase()
      Promise.all([
        sb.from('directory_providers').select('*').order('category').order('position'),
        sb.from('directory_applications').select('*').order('created_at', { ascending: false }),
      ]).then(([{ data: provs }, { data: apps }]) => {
        setProviders(provs || [])
        setDirApps(apps || [])
        setDirectoryLoaded(true)
      })
    }
  }, [activeTab, directoryLoaded])

  // ── Lazy load coach applications ───────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'coaches' && !coachAppsLoaded) {
      loadCoachApps()
    }
  }, [activeTab, coachAppsLoaded])

  async function loadCoachApps() {
    try {
      const sb = getSupabase()
      const session = await sb.auth.getSession()
      const token = session?.data?.session?.access_token || ''
      const res = await fetch(`${API_BASE}/api/admin/coach-applications`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error('Failed to load coach applications')
      const data = await res.json()
      setCoachApps(data.applications || data)
      setCoachAppsLoaded(true)
    } catch (err: any) {
      showToast('Failed to load coach applications: ' + err.message, 'error')
    }
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function handleSignOut() {
    const sb = getSupabase()
    await sb.auth.signOut()
    window.location.href = '/login'
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function cohortName(id: number): string {
    const c = cohorts.find(c => c.id === id)
    return c ? c.name : `Cohort ${id}`
  }

  function iotecPayment(regId: number, paymentType: string) {
    return payReqs.find(p => p.registration_id === regId && p.payment_type === paymentType) || null
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: T.ink, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <V6Mark size={48} onDark />
        <span style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: T.paper, opacity: 0.5,
        }}>
          Loading Command Centre
        </span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.paper, fontFamily: "'Josefin Sans', Inter, system-ui, sans-serif" }}>
      {/* ── TOPBAR ───────────────────────────────────────────────────────── */}
      <header style={{
        background: T.ink, padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <V6Mark size={28} onDark />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: T.paper, opacity: 0.8,
          }}>
            The Founder's Sprint
          </span>
          <div style={{ width: 1, height: 20, background: 'rgba(239,231,216,0.15)' }} />
          <span style={{
            fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: T.ochre, fontWeight: 700,
          }}>
            Command Centre
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: T.paper, opacity: 0.5 }}>{userEmail}</span>
          <button onClick={handleSignOut} style={{
            background: 'transparent', border: `1px solid rgba(239,231,216,0.15)`,
            color: T.paper, opacity: 0.6, padding: '6px 14px', fontSize: 9,
            fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.15em',
            textTransform: 'uppercase', cursor: 'pointer',
          }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <nav style={{
        background: T.paperDeep, borderBottom: `1px solid ${T.rule}`,
        padding: '0 32px', display: 'flex', gap: 0,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          const pendingCoachApps = coachApps.filter(a => a.status === 'pending').length
          const pendingDirApps = dirApps.filter(a => a.status === 'pending').length
          const badge = tab.id === 'coaches' && pendingCoachApps > 0
            ? pendingCoachApps
            : tab.id === 'directory' && pendingDirApps > 0
              ? pendingDirApps
              : null

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none',
                borderBottom: `3px solid ${isActive ? T.terra : 'transparent'}`,
                color: isActive ? T.terra : T.inkMute,
                cursor: 'pointer', padding: '16px 24px 13px',
                fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
                fontWeight: 700, fontFamily: "'Josefin Sans', sans-serif",
                transition: 'all 0.2s', marginBottom: -1,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {tab.label}
              {badge && (
                <span style={{
                  background: T.danger, color: '#fff', fontSize: 10,
                  fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                  minWidth: 18, textAlign: 'center', lineHeight: '16px',
                }}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <main style={{ padding: 32, maxWidth: 1500, margin: '0 auto' }}>
        {activeTab === 'overview' && (
          <OverviewTab
            regs={regs} cohorts={cohorts} payReqs={payReqs}
            coaches={coaches} cohortName={cohortName}
            showToast={showToast} loadAllData={loadAllData}
          />
        )}
        {activeTab === 'registrations' && (
          <RegistrationsTab
            regs={regs} cohorts={cohorts} payReqs={payReqs}
            cohortName={cohortName} iotecPayment={iotecPayment}
            showToast={showToast} loadAllData={loadAllData}
          />
        )}
        {activeTab === 'revenue' && (
          <RevenueTab regs={regs} cohorts={cohorts} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab
            docs={docs} setDocs={setDocs} cohorts={cohorts}
            cohortName={cohortName} showToast={showToast}
          />
        )}
        {activeTab === 'directory' && (
          <DirectoryTab
            providers={providers} dirApps={dirApps}
            setProviders={setProviders} setDirApps={setDirApps}
            showToast={showToast}
            onReload={() => { setDirectoryLoaded(false) }}
          />
        )}
        {activeTab === 'coaches' && (
          <CoachAppsTab
            apps={coachApps}
            reviewerEmail={userEmail}
            showToast={showToast}
            onReload={() => { setCoachAppsLoaded(false) }}
          />
        )}
      </main>

      {/* ── TOAST ────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? T.danger : toast.type === 'success' ? T.success : T.ink,
          color: T.paper, padding: '12px 24px', fontSize: 13,
          fontFamily: "'Josefin Sans', sans-serif",
          zIndex: 9999, maxWidth: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${T.rule}`, padding: '20px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: T.inkMute, opacity: 0.5,
        }}>
          The Founder's Sprint
        </span>
        <span style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: 11, color: T.terra, opacity: 0.5,
        }}>
          Build with direction.
        </span>
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ regs, cohorts, payReqs, coaches, cohortName, showToast, loadAllData }: {
  regs: Registration[]
  cohorts: Cohort[]
  payReqs: PaymentRequest[]
  coaches: Coach[]
  cohortName: (id: number) => string
  showToast: (msg: string, type?: string) => void
  loadAllData: () => Promise<void>
}) {
  const active = regs.filter(r => !r.forfeited)
  const fullyPaid = active.filter(r => r.deposit_paid && r.balance_paid)
  const depositOnly = active.filter(r => r.deposit_paid && !r.balance_paid)
  const collected = active.reduce(
    (s, r) => s + (r.deposit_paid ? r.deposit_amount : 0) + (r.balance_paid ? r.balance_amount : 0), 0
  )
  const pending = depositOnly.reduce((s, r) => s + r.balance_amount, 0)
  const openCohorts = cohorts.filter(c => c.status !== 'full').length

  const stats = [
    { label: 'Registrations', value: String(active.length), color: T.terra, sub: 'active (non-forfeited)' },
    { label: 'Revenue Collected', value: fmtUGX(collected), color: T.ochre, sub: 'deposits + balances' },
    { label: 'Pending Balance', value: fmtUGX(pending), color: T.warning, sub: `${depositOnly.length} founder${depositOnly.length !== 1 ? 's' : ''} awaiting` },
    { label: 'Open Cohorts', value: String(openCohorts), color: T.sage, sub: 'accepting registrations' },
    { label: 'Fully Paid', value: String(fullyPaid.length), color: T.success, sub: 'deposit + balance confirmed' },
    { label: 'Deposit Only', value: String(depositOnly.length), color: T.stone, sub: 'balance outstanding' },
  ]

  return (
    <div>
      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderLeft: `4px solid ${s.color}`,
            padding: '22px 20px 18px', border: `1px solid ${T.rule}`,
            borderLeftWidth: 4, borderLeftColor: s.color,
          }}>
            <div style={{
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: T.inkMute, marginBottom: 10, fontWeight: 700,
            }}>
              {s.label}
            </div>
            <div style={{
              fontSize: 32, fontWeight: 300, color: T.ink, lineHeight: 1,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              letterSpacing: '-0.02em',
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: T.inkMute, marginTop: 8 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts placeholder — will use dynamic import for Chart.js */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28,
      }}>
        <ChartCard title="Registrations by Track" regs={active} type="track" />
        <ChartCard title="Registrations by Sector" regs={active} type="sector" />
      </div>

      <RevenueBarChart regs={regs} cohorts={cohorts} cohortName={cohortName} />

      {/* Meeting Invite Card */}
      <div style={{ marginTop: 32 }}>
        <SectionHead title="Meeting Invites" />
        <MeetingInviteCard coaches={coaches} showToast={showToast} />
      </div>
    </div>
  )
}

// ── SECTION HEAD ─────────────────────────────────────────────────────────────
function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 16, height: 2, background: T.terra }} />
      <span style={{
        fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
        fontWeight: 700, color: T.terra,
      }}>
        {title}
      </span>
    </div>
  )
}

// ── CHART CARDS (Canvas-based, using Chart.js via CDN script) ────────────────
function ChartCard({ title, regs, type }: { title: string; regs: Registration[]; type: 'track' | 'sector' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    const loadAndRender = async () => {
      // Dynamically load Chart.js if not present
      if (!(window as any).Chart) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js'
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }

      const Chart = (window as any).Chart
      if (!canvasRef.current || !Chart) return

      if (chartRef.current) chartRef.current.destroy()

      const PALETTE = [T.terra, T.ochre, T.sage, T.moss, T.stone, '#E63946', '#2D6BE4', '#0CB4AD']

      if (type === 'track') {
        const group = regs.filter(r => r.track === 'group').length
        const oneOnOne = regs.filter(r => r.track === 'oneOnOne').length
        const vip = regs.filter(r => r.track === 'vip').length
        chartRef.current = new Chart(canvasRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Group', '1-on-1', 'VIP'],
            datasets: [{ data: [group, oneOnOne, vip], backgroundColor: [T.terra, T.ochre, T.sage], borderWidth: 0, hoverOffset: 8 }],
          },
          options: {
            cutout: '68%', maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: T.inkMute, font: { family: "'Josefin Sans'", size: 11 }, boxWidth: 10, padding: 16 } },
              tooltip: { backgroundColor: T.paper, borderColor: T.rule, borderWidth: 1, titleColor: T.terra, bodyColor: T.ink, padding: 12 },
            },
          },
        })
      } else {
        const counts: Record<string, number> = {}
        regs.forEach(r => { const s = r.sector || 'Not specified'; counts[s] = (counts[s] || 0) + 1 })
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
        chartRef.current = new Chart(canvasRef.current, {
          type: 'doughnut',
          data: {
            labels: sorted.map(([k]) => k),
            datasets: [{ data: sorted.map(([, v]) => v), backgroundColor: PALETTE.slice(0, sorted.length), borderWidth: 0, hoverOffset: 8 }],
          },
          options: {
            cutout: '62%', maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: T.inkMute, font: { family: "'Josefin Sans'", size: 11 }, boxWidth: 10, padding: 16 } },
              tooltip: { backgroundColor: T.paper, borderColor: T.rule, borderWidth: 1, titleColor: T.terra, bodyColor: T.ink, padding: 12 },
            },
          },
        })
      }
    }

    loadAndRender()
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [regs, type])

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.rule}`, padding: '28px 24px 24px',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${T.terra}, ${T.ochre})`,
      }} />
      <div style={{
        fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
        fontWeight: 700, color: T.inkMute, marginBottom: 24,
      }}>
        {title}
      </div>
      <div style={{ position: 'relative', height: 270 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// ── REVENUE BAR CHART ────────────────────────────────────────────────────────
function RevenueBarChart({ regs, cohorts, cohortName }: { regs: Registration[]; cohorts: Cohort[]; cohortName: (id: number) => string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    const loadAndRender = async () => {
      if (!(window as any).Chart) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js'
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }
      const Chart = (window as any).Chart
      if (!canvasRef.current || !Chart) return
      if (chartRef.current) chartRef.current.destroy()

      const byC: Record<number, { name: string; collected: number }> = {}
      cohorts.forEach(c => { byC[c.id] = { name: c.name, collected: 0 } })
      regs.filter(r => !r.forfeited).forEach(r => {
        if (!byC[r.cohort_id]) byC[r.cohort_id] = { name: cohortName(r.cohort_id), collected: 0 }
        if (r.deposit_paid) byC[r.cohort_id].collected += r.deposit_amount
        if (r.balance_paid) byC[r.cohort_id].collected += r.balance_amount
      })

      const labels = Object.values(byC).map(c => c.name)
      const data = Object.values(byC).map(c => c.collected)
      const PALETTE = [T.terra, T.ochre, T.sage, T.moss, T.stone, '#E63946', '#2D6BE4', '#0CB4AD']

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Collected (UGX)',
            data,
            backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
            borderRadius: 0, borderWidth: 0,
          }],
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: T.paper, borderColor: T.rule, borderWidth: 1, titleColor: T.terra, bodyColor: T.ink, padding: 12 },
          },
          scales: {
            x: {
              ticks: { color: T.inkMute, font: { family: "'Josefin Sans'", size: 11 } },
              grid: { color: 'rgba(26,26,26,0.06)' },
            },
            y: {
              ticks: { color: T.inkMute, font: { family: "'Cormorant Garamond'", size: 10 }, callback: (v: number) => fmtUGX(v) },
              grid: { color: 'rgba(26,26,26,0.06)' },
            },
          },
          maintainAspectRatio: false,
        },
      })
    }
    loadAndRender()
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [regs, cohorts, cohortName])

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.rule}`, padding: '28px 24px 24px',
      position: 'relative', marginBottom: 28,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${T.ochre}, ${T.terra})`,
      }} />
      <div style={{
        fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
        fontWeight: 700, color: T.inkMute, marginBottom: 24,
      }}>
        Revenue by Cohort
      </div>
      <div style={{ position: 'relative', height: 300 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// ── MEETING INVITE CARD ──────────────────────────────────────────────────────
function MeetingInviteCard({ coaches, showToast }: { coaches: Coach[]; showToast: (msg: string, type?: string) => void }) {
  const [sending, setSending] = useState(false)
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set())
  const [failedEmails, setFailedEmails] = useState<Set<string>>(new Set())
  const [statusMsg, setStatusMsg] = useState('')

  async function sendInvites() {
    if (!coaches.length) return
    if (!confirm(`Send the founding team meeting invite to all ${coaches.length} coaches?`)) return

    setSending(true)
    setStatusMsg('')
    setSentEmails(new Set())
    setFailedEmails(new Set())

    try {
      const sb = getSupabase()
      const session = await sb.auth.getSession()
      const token = session?.data?.session?.access_token || ''

      const res = await fetch(`${API_BASE}/api/admin/send-founding-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')

      if (data.results) {
        const sent = new Set<string>()
        const failed = new Set<string>()
        data.results.forEach((r: any) => { if (r.ok) sent.add(r.email); else failed.add(r.email) })
        setSentEmails(sent)
        setFailedEmails(failed)
      }

      if (data.ok) {
        setStatusMsg(`All ${data.sent} invites sent successfully`)
        showToast('Meeting invites sent to all coaches!', 'success')
      } else {
        setStatusMsg(`${data.sent}/${data.total} sent — check results`)
      }
    } catch (err: any) {
      setStatusMsg('Error: ' + err.message)
      showToast('Failed to send invites: ' + err.message, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.rule}`, padding: '24px 28px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${T.ochre}, ${T.terra}, ${T.ochre})`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Send Meeting Invite</span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {coaches.map(c => {
          const email = c.founderssprint_email || c.email
          const isSent = sentEmails.has(email)
          const isFailed = failedEmails.has(email)
          return (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T.paper, border: `1px solid ${isSent ? T.success : isFailed ? T.danger : T.rule}`,
              padding: '8px 14px', fontSize: 12,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: isSent ? T.success : isFailed ? T.danger : T.inkMute,
                flexShrink: 0,
              }} />
              <span style={{ fontWeight: 600 }}>{c.first_name}</span>
              <span style={{ color: T.inkMute, fontSize: 11 }}>{email}</span>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={sendInvites}
          disabled={sending || !coaches.length}
          style={{
            background: sending ? T.ochre : T.ink, color: sending ? T.ink : T.ochre,
            border: 'none', padding: '12px 32px', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer',
            opacity: sending || !coaches.length ? 0.5 : 1,
          }}
        >
          {sending ? 'Sending...' : coaches.length ? `Send Invite to All ${coaches.length}` : 'No Coaches Found'}
        </button>
        {statusMsg && (
          <span style={{ fontSize: 12, color: statusMsg.startsWith('Error') ? T.danger : T.success }}>
            {statusMsg}
          </span>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATIONS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function RegistrationsTab({ regs, cohorts, payReqs, cohortName, iotecPayment, showToast, loadAllData }: {
  regs: Registration[]
  cohorts: Cohort[]
  payReqs: PaymentRequest[]
  cohortName: (id: number) => string
  iotecPayment: (regId: number, type: string) => PaymentRequest | null
  showToast: (msg: string, type?: string) => void
  loadAllData: () => Promise<void>
}) {
  const [cohortFilter, setCohortFilter] = useState('')
  const [trackFilter, setTrackFilter] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [search, setSearch] = useState('')

  // Payment modal state
  const [payModal, setPayModal] = useState<{ regId: number; type: string } | null>(null)
  const [payMethod, setPayMethod] = useState('mobile_money')
  const [payRef, setPayRef] = useState('')
  const [payNote, setPayNote] = useState('')

  function paymentStatus(r: Registration) {
    if (r.forfeited) return { label: 'Forfeited', cls: 'forfeited' }
    if (r.deposit_paid && r.balance_paid) return { label: 'Fully Paid', cls: 'paid' }
    if (r.deposit_paid) return { label: 'Deposit Only', cls: 'partial' }
    return { label: 'No Payment', cls: 'unpaid' }
  }

  const filtered = regs.filter(r => {
    if (cohortFilter && String(r.cohort_id) !== cohortFilter) return false
    if (trackFilter && r.track !== trackFilter) return false
    if (payFilter === 'fully_paid' && !(r.deposit_paid && r.balance_paid)) return false
    if (payFilter === 'deposit_only' && !(r.deposit_paid && !r.balance_paid)) return false
    if (payFilter === 'unpaid' && (r.deposit_paid || r.forfeited)) return false
    if (payFilter === 'forfeited' && !r.forfeited) return false
    if (search) {
      const name = `${r.first_name} ${r.last_name}`.toLowerCase()
      if (!name.includes(search.toLowerCase()) && !r.email.toLowerCase().includes(search.toLowerCase())) return false
    }
    return true
  })

  async function sendIotecRequest(regId: number, paymentType: string) {
    const r = regs.find(r => r.id === regId)
    if (!r || !r.phone) { showToast('No phone number on file.', 'error'); return }
    const phone = prompt(`Send ${paymentType} request to phone:`, r.phone)
    if (!phone) return
    try {
      const res = await fetch(`${API_BASE}/api/payment-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: regId, paymentType, phone }),
      })
      const data = await res.json()
      if (!res.ok && !data.pending) throw new Error(data.error || 'Failed')
      showToast(data.message || 'Payment prompt sent!', 'success')
    } catch (err: any) {
      showToast('ioTec error: ' + err.message, 'error')
    }
  }

  async function submitPayment() {
    if (!payModal) return
    try {
      const res = await fetch(`${API_BASE}/api/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: payModal.regId,
          paymentType: payModal.type,
          method: payMethod,
          reference: payRef,
          note: payNote,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Unknown error')
      showToast('Payment confirmed', 'success')
      setPayModal(null)
      await loadAllData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const badgeColors: Record<string, { bg: string; fg: string; border: string }> = {
    paid: { bg: 'rgba(10,143,100,0.12)', fg: T.success, border: 'rgba(10,143,100,0.3)' },
    partial: { bg: 'rgba(196,127,8,0.12)', fg: T.warning, border: 'rgba(196,127,8,0.3)' },
    unpaid: { bg: 'rgba(220,53,69,0.1)', fg: T.danger, border: 'rgba(220,53,69,0.25)' },
    forfeited: { bg: 'rgba(100,100,100,0.08)', fg: '#888', border: 'rgba(100,100,100,0.18)' },
  }

  const trackColors: Record<string, { bg: string; fg: string; border: string }> = {
    group: { bg: 'rgba(200,83,31,0.10)', fg: T.terra, border: 'rgba(200,83,31,0.25)' },
    oneOnOne: { bg: 'rgba(201,146,58,0.10)', fg: T.ochre, border: 'rgba(201,146,58,0.3)' },
    vip: { bg: 'rgba(138,171,92,0.10)', fg: T.sage, border: 'rgba(138,171,92,0.25)' },
  }

  const selectStyle: React.CSSProperties = {
    background: '#fff', border: `1px solid ${T.rule}`, borderLeft: `3px solid ${T.terra}`,
    color: T.ink, padding: '8px 12px', fontSize: 12,
    fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer', outline: 'none',
  }

  const inputStyle: React.CSSProperties = {
    ...selectStyle, minWidth: 220, borderLeftColor: T.ochre,
  }

  return (
    <div>
      <SectionHead title="Registrations" />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={cohortFilter} onChange={e => setCohortFilter(e.target.value)} style={selectStyle}>
          <option value="">All Cohorts</option>
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={trackFilter} onChange={e => setTrackFilter(e.target.value)} style={selectStyle}>
          <option value="">All Tracks</option>
          <option value="group">Group</option>
          <option value="oneOnOne">1-on-1</option>
          <option value="vip">VIP</option>
        </select>
        <select value={payFilter} onChange={e => setPayFilter(e.target.value)} style={selectStyle}>
          <option value="">All Payments</option>
          <option value="fully_paid">Fully Paid</option>
          <option value="deposit_only">Deposit Only</option>
          <option value="unpaid">Unpaid</option>
          <option value="forfeited">Forfeited</option>
        </select>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..." style={inputStyle}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              {['ID', 'Name', 'Email', 'Cohort', 'Track', 'Sector', 'Deposit', 'Balance', 'Full Fee', 'Status', 'Date', 'Actions'].map((h, i) => (
                <th key={h} style={{
                  background: T.paper, color: T.inkMute, padding: '11px 14px',
                  textAlign: 'left', fontSize: 9, letterSpacing: '0.15em',
                  textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap',
                  borderBottom: `1px solid ${T.rule}`,
                  ...(i === 0 ? { borderLeft: `3px solid ${T.terra}`, paddingLeft: 16 } : {}),
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={12} style={{ textAlign: 'center', color: T.inkMute, padding: 32 }}>No registrations match this filter.</td></tr>
            ) : filtered.map(r => {
              const { label, cls } = paymentStatus(r)
              const bc = badgeColors[cls] || badgeColors.unpaid
              const tc = trackColors[r.track] || trackColors.group
              const depIotec = iotecPayment(r.id, 'deposit')
              const balIotec = iotecPayment(r.id, 'balance')

              return (
                <tr key={r.id} style={{ opacity: r.forfeited ? 0.35 : 1 }}>
                  <td style={{ padding: '12px 14px', paddingLeft: 16, borderBottom: `1px solid rgba(26,26,26,0.06)`, color: T.inkMute, fontFamily: "'Cormorant Garamond', serif", fontSize: 13 }}>#{r.id}</td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)` }}>
                    <strong>{r.first_name} {r.last_name}</strong>
                    {r.company && <><br /><span style={{ color: T.inkMute, fontSize: 10 }}>{r.company}</span></>}
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)`, color: T.inkMute }}>{r.email}</td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)` }}>{cohortName(r.cohort_id)}</td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)` }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 9px', fontSize: 9,
                      letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                      background: tc.bg, color: tc.fg, border: `1px solid ${tc.border}`,
                    }}>
                      {r.track === 'oneOnOne' ? '1-on-1' : r.track === 'vip' ? 'VIP' : 'Group'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)`, color: T.inkMute, fontSize: 11 }}>{r.sector || '—'}</td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)`, fontFamily: "'Cormorant Garamond', serif", color: r.deposit_paid ? T.success : T.danger }}>
                    {fmtUGX(r.deposit_amount)}
                    {depIotec && <span style={{ marginLeft: 4, fontSize: 9, background: 'rgba(12,180,173,0.15)', color: '#0A918B', padding: '2px 7px', border: '1px solid rgba(12,180,173,0.3)' }}>IOTEC</span>}
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)`, fontFamily: "'Cormorant Garamond', serif", color: r.balance_paid ? T.success : undefined }}>
                    {fmtUGX(r.balance_amount)}
                    {balIotec && <span style={{ marginLeft: 4, fontSize: 9, background: 'rgba(12,180,173,0.15)', color: '#0A918B', padding: '2px 7px', border: '1px solid rgba(12,180,173,0.3)' }}>IOTEC</span>}
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)`, fontFamily: "'Cormorant Garamond', serif" }}>{fmtUGX(r.full_fee)}</td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)` }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 9px', fontSize: 9,
                      letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                      background: bc.bg, color: bc.fg, border: `1px solid ${bc.border}`,
                    }}>
                      {label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)`, color: T.inkMute, fontSize: 11 }}>{fmtDate(r.created_at)}</td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)` }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!r.deposit_paid && !r.forfeited && (
                        <>
                          <ActionBtn label="Send" color="#0A918B" onClick={() => sendIotecRequest(r.id, 'deposit')} />
                          <ActionBtn label="Manual" color={T.success} onClick={() => setPayModal({ regId: r.id, type: 'deposit' })} />
                        </>
                      )}
                      {r.deposit_paid && !r.balance_paid && !r.forfeited && (
                        <>
                          <ActionBtn label="Send" color="#0A918B" onClick={() => sendIotecRequest(r.id, 'balance')} />
                          <ActionBtn label="Manual" color={T.success} onClick={() => setPayModal({ regId: r.id, type: 'balance' })} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setPayModal(null)}>
          <div style={{
            background: T.paper, padding: '32px 28px', maxWidth: 420, width: '100%',
            border: `1px solid ${T.rule}`,
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              fontWeight: 700, color: T.terra, marginBottom: 20,
            }}>
              Confirm {payModal.type === 'deposit' ? 'Deposit' : 'Balance'} Payment
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.inkMute, display: 'block', marginBottom: 6 }}>Method</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.inkMute, display: 'block', marginBottom: 6 }}>Reference</label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transaction reference" style={{ ...inputStyle, width: '100%', minWidth: 0 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.inkMute, display: 'block', marginBottom: 6 }}>Note</label>
              <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Optional note" style={{ ...inputStyle, width: '100%', minWidth: 0 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={submitPayment} style={{
                background: T.terra, color: T.paper, border: 'none', padding: '12px 24px',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer',
              }}>
                Confirm Payment
              </button>
              <button onClick={() => setPayModal(null)} style={{
                background: 'transparent', border: `1px solid ${T.rule}`,
                color: T.inkMute, padding: '12px 24px', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ACTION BUTTON ────────────────────────────────────────────────────────────
function ActionBtn({ label, color, onClick, disabled }: { label: string; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent', border: `1px solid ${color}40`,
        color, padding: '4px 10px', fontSize: 9, letterSpacing: '0.08em',
        textTransform: 'uppercase', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Josefin Sans', sans-serif", whiteSpace: 'nowrap',
        opacity: disabled ? 0.3 : 1,
      }}
    >
      {label}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE TAB
// ═══════════════════════════════════════════════════════════════════════════════
function RevenueTab({ regs, cohorts }: { regs: Registration[]; cohorts: Cohort[] }) {
  const active = regs.filter(r => !r.forfeited)
  const totalFees = active.reduce((s, r) => s + r.full_fee, 0)
  const collected = active.reduce((s, r) => s + (r.deposit_paid ? r.deposit_amount : 0) + (r.balance_paid ? r.balance_amount : 0), 0)
  const outstanding = active.filter(r => r.deposit_paid && !r.balance_paid).reduce((s, r) => s + r.balance_amount, 0)

  const tracks = [
    { key: 'group', label: 'Group' },
    { key: 'oneOnOne', label: '1-on-1' },
    { key: 'vip', label: 'VIP' },
  ]

  function trackRow(key: string) {
    const t = active.filter(r => r.track === key)
    const col = t.reduce((s, r) => s + (r.deposit_paid ? r.deposit_amount : 0) + (r.balance_paid ? r.balance_amount : 0), 0)
    const out = t.filter(r => r.deposit_paid && !r.balance_paid).reduce((s, r) => s + r.balance_amount, 0)
    return { count: t.length, collected: col, outstanding: out }
  }

  const thStyle: React.CSSProperties = {
    background: T.paper, color: T.inkMute, padding: '10px 14px',
    fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700,
    borderBottom: `1px solid ${T.rule}`, textAlign: 'left',
  }

  const tdStyle: React.CSSProperties = {
    padding: '11px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)`,
  }

  return (
    <div>
      <SectionHead title="Revenue Summary" />

      {/* Top-level stats */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
        {[
          { label: 'Total Fees', value: fmtUGX(totalFees), color: T.ink },
          { label: 'Collected', value: fmtUGX(collected), color: T.ochre },
          { label: 'Outstanding', value: fmtUGX(outstanding), color: outstanding > 0 ? T.danger : T.inkMute },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.inkMute, fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* By Track */}
        <div>
          <SectionHead title="Revenue by Track" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Track</th>
                <th style={thStyle}>Count</th>
                <th style={thStyle}>Collected</th>
                <th style={thStyle}>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map(({ key, label }) => {
                const d = trackRow(key)
                return (
                  <tr key={key}>
                    <td style={tdStyle}>{label}</td>
                    <td style={tdStyle}>{d.count}</td>
                    <td style={{ ...tdStyle, color: T.ochre, fontFamily: "'Cormorant Garamond', serif" }}>{fmtUGX(d.collected)}</td>
                    <td style={{ ...tdStyle, color: d.outstanding > 0 ? T.danger : undefined, fontFamily: "'Cormorant Garamond', serif" }}>{fmtUGX(d.outstanding)}</td>
                  </tr>
                )
              })}
              <tr style={{ fontWeight: 700 }}>
                <td style={{ ...tdStyle, color: T.terra, borderTop: `1px solid ${T.terra}` }}>Total</td>
                <td style={{ ...tdStyle, borderTop: `1px solid ${T.terra}` }}>{active.length}</td>
                <td style={{ ...tdStyle, borderTop: `1px solid ${T.terra}`, fontFamily: "'Cormorant Garamond', serif" }}>{fmtUGX(collected)}</td>
                <td style={{ ...tdStyle, borderTop: `1px solid ${T.terra}`, fontFamily: "'Cormorant Garamond', serif" }}>{fmtUGX(outstanding)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* By Cohort */}
        <div>
          <SectionHead title="Revenue by Cohort" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Cohort</th>
                <th style={thStyle}>Count</th>
                <th style={thStyle}>Collected</th>
                <th style={thStyle}>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map(c => {
                const cRegs = active.filter(r => r.cohort_id === c.id)
                const col = cRegs.reduce((s, r) => s + (r.deposit_paid ? r.deposit_amount : 0) + (r.balance_paid ? r.balance_amount : 0), 0)
                const out = cRegs.filter(r => r.deposit_paid && !r.balance_paid).reduce((s, r) => s + r.balance_amount, 0)
                return (
                  <tr key={c.id}>
                    <td style={tdStyle}>{c.name}</td>
                    <td style={tdStyle}>{cRegs.length}</td>
                    <td style={{ ...tdStyle, color: T.ochre, fontFamily: "'Cormorant Garamond', serif" }}>{fmtUGX(col)}</td>
                    <td style={{ ...tdStyle, color: out > 0 ? T.danger : undefined, fontFamily: "'Cormorant Garamond', serif" }}>{fmtUGX(out)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function DocumentsTab({ docs, setDocs, cohorts, cohortName, showToast }: {
  docs: Document[]
  setDocs: (d: Document[]) => void
  cohorts: Cohort[]
  cohortName: (id: number) => string
  showToast: (msg: string, type?: string) => void
}) {
  const [catFilter, setCatFilter] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [docDesc, setDocDesc] = useState('')
  const [docCategory, setDocCategory] = useState('slides')
  const [docCohort, setDocCohort] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = catFilter ? docs.filter(d => d.category === catFilter) : docs

  function fileIcon(mime?: string) {
    if (!mime) return '\u{1F4C4}'
    if (mime.includes('pdf')) return '\u{1F4D5}'
    if (mime.includes('word')) return '\u{1F4D8}'
    if (mime.includes('sheet') || mime.includes('excel')) return '\u{1F4D7}'
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '\u{1F4D9}'
    if (mime.includes('image')) return '\u{1F5BC}'
    if (mime.includes('video')) return '\u{1F3AC}'
    return '\u{1F4C4}'
  }

  function onFileSelect(file: File) {
    setSelectedFile(file)
    setDocName(file.name.replace(/\.[^.]+$/, ''))
  }

  async function uploadDocument() {
    if (!selectedFile) return
    setUploading(true)
    try {
      const sb = getSupabase()
      const ext = selectedFile.name.split('.').pop()
      const safeName = (docName || selectedFile.name).replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
      const path = `${docCategory}/${Date.now()}_${safeName}.${ext}`

      const { error: uploadErr } = await sb.storage.from('course-materials').upload(path, selectedFile, { upsert: false })
      if (uploadErr) throw uploadErr

      const { error: dbErr } = await sb.from('documents').insert({
        name: docName || selectedFile.name,
        description: docDesc || null,
        category: docCategory,
        cohort_id: docCohort ? parseInt(docCohort) : null,
        storage_path: path,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
      })
      if (dbErr) throw dbErr

      showToast('Document uploaded', 'success')
      setSelectedFile(null)
      setDocName('')
      setDocDesc('')

      const { data } = await sb.from('documents').select('*').order('created_at', { ascending: false })
      setDocs(data || [])
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function openDoc(path: string) {
    const sb = getSupabase()
    const { data } = await sb.storage.from('course-materials').createSignedUrl(path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    else showToast('Could not generate download link', 'error')
  }

  async function deleteDoc(id: number, path: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    const sb = getSupabase()
    await sb.storage.from('course-materials').remove([path])
    await sb.from('documents').delete().eq('id', id)
    setDocs(docs.filter(d => d.id !== id))
    showToast('Document deleted', 'success')
  }

  const selectStyle: React.CSSProperties = {
    background: '#fff', border: `1px solid ${T.rule}`, borderLeft: `3px solid ${T.terra}`,
    color: T.ink, padding: '8px 12px', fontSize: 12,
    fontFamily: "'Josefin Sans', sans-serif", outline: 'none',
  }

  return (
    <div>
      <SectionHead title="Course Materials" />

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) onFileSelect(e.dataTransfer.files[0]) }}
        style={{
          border: `1px dashed rgba(200,83,31,0.35)`, borderLeft: `4px solid ${T.terra}`,
          padding: 36, textAlign: 'center', marginBottom: 24, cursor: 'pointer',
          background: '#fff',
        }}
      >
        <div style={{ fontSize: 30 }}>{'\u{1F4E4}'}</div>
        <p style={{ color: T.inkMute, fontSize: 13, marginTop: 8 }}>
          {selectedFile ? `Selected: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(1)} MB)` : 'Click or drag & drop a file to upload'}
        </p>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) onFileSelect(e.target.files[0]) }} />
      </div>

      {selectedFile && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Document name" style={{ ...selectStyle, flex: 1, minWidth: 160 }} />
          <input value={docDesc} onChange={e => setDocDesc(e.target.value)} placeholder="Description (optional)" style={{ ...selectStyle, flex: 1, minWidth: 160 }} />
          <select value={docCategory} onChange={e => setDocCategory(e.target.value)} style={selectStyle}>
            <option value="slides">Slides</option>
            <option value="handout">Handout</option>
            <option value="template">Template</option>
            <option value="worksheet">Worksheet</option>
            <option value="other">Other</option>
          </select>
          <select value={docCohort} onChange={e => setDocCohort(e.target.value)} style={selectStyle}>
            <option value="">All Cohorts</option>
            {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={uploadDocument} disabled={uploading} style={{
            background: T.terra, color: T.paper, border: 'none', padding: '9px 22px',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
            fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer',
            opacity: uploading ? 0.5 : 1,
          }}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button onClick={() => { setSelectedFile(null); setDocName('') }} style={{
            background: 'transparent', border: `1px solid ${T.rule}`, color: T.inkMute,
            padding: '9px 16px', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
            fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selectStyle}>
          <option value="">All Categories</option>
          <option value="slides">Slides</option>
          <option value="handout">Handout</option>
          <option value="template">Template</option>
          <option value="worksheet">Worksheet</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Document list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: T.inkMute, padding: 32 }}>No documents uploaded yet.</div>
        ) : filtered.map(d => (
          <div key={d.id} style={{
            background: '#fff', border: `1px solid ${T.rule}`, borderLeft: `4px solid ${T.sage}`,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{fileIcon(d.mime_type)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
              <div style={{ fontSize: 10, color: T.inkMute, marginTop: 4 }}>
                {d.category} {'·'} {d.cohort_id ? cohortName(d.cohort_id) : 'All cohorts'} {'·'} {d.file_size ? (d.file_size / 1024 / 1024).toFixed(1) + 'MB' : ''} {'·'} {fmtDate(d.created_at)}
                {d.description ? ` · ${d.description}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <ActionBtn label="Open" color={T.terra} onClick={() => openDoc(d.storage_path)} />
              <ActionBtn label="Delete" color={T.danger} onClick={() => deleteDoc(d.id, d.storage_path)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIRECTORY TAB
// ═══════════════════════════════════════════════════════════════════════════════
function DirectoryTab({ providers, dirApps, setProviders, setDirApps, showToast, onReload }: {
  providers: Provider[]
  dirApps: DirApplication[]
  setProviders: (p: Provider[]) => void
  setDirApps: (a: DirApplication[]) => void
  showToast: (msg: string, type?: string) => void
  onReload: () => void
}) {
  const [subTab, setSubTab] = useState<'applications' | 'listings' | 'add'>('applications')
  const pendingApps = dirApps.filter(a => a.status === 'pending').length

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `1px solid ${T.rule}` }}>
        {(['applications', 'listings', 'add'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            style={{
              fontFamily: "'Josefin Sans', sans-serif", fontSize: 12, fontWeight: 600,
              letterSpacing: '0.04em', padding: '10px 18px', background: 'none', border: 'none',
              color: subTab === tab ? T.terra : T.inkMute, cursor: 'pointer',
              borderBottom: `2px solid ${subTab === tab ? T.terra : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab === 'applications' ? 'Applications' : tab === 'listings' ? 'Listings' : 'Add Provider'}
            {tab === 'applications' && pendingApps > 0 && (
              <span style={{
                background: T.danger, color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '1px 6px', borderRadius: 8, minWidth: 18, textAlign: 'center',
              }}>
                {pendingApps}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'applications' && (
        <DirApplicationsPanel dirApps={dirApps} showToast={showToast} onReload={onReload} />
      )}
      {subTab === 'listings' && (
        <DirListingsPanel providers={providers} showToast={showToast} onReload={onReload} />
      )}
      {subTab === 'add' && (
        <div style={{ textAlign: 'center', color: T.inkMute, padding: 48 }}>
          Add provider form coming in next build phase.
        </div>
      )}
    </div>
  )
}

function DirApplicationsPanel({ dirApps, showToast, onReload }: {
  dirApps: DirApplication[]
  showToast: (msg: string, type?: string) => void
  onReload: () => void
}) {
  const [filter, setFilter] = useState('')
  const filtered = filter ? dirApps.filter(a => a.status === filter) : dirApps

  async function approveApp(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('directory_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { showToast('Failed: ' + error.message, 'error'); return }
    showToast('Application approved', 'success')
    onReload()
  }

  async function rejectApp(id: string) {
    if (!confirm('Reject this application?')) return
    const sb = getSupabase()
    const { error } = await sb.from('directory_applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { showToast('Failed: ' + error.message, 'error'); return }
    showToast('Application rejected', 'info')
    onReload()
  }

  const thStyle: React.CSSProperties = {
    background: T.paper, color: T.inkMute, padding: '11px 14px',
    textAlign: 'left', fontSize: 9, letterSpacing: '0.15em',
    textTransform: 'uppercase', fontWeight: 700, borderBottom: `1px solid ${T.rule}`,
  }
  const tdStyle: React.CSSProperties = { padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)` }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{
          background: '#fff', border: `1px solid ${T.rule}`, borderLeft: `3px solid ${T.terra}`,
          color: T.ink, padding: '8px 12px', fontSize: 12,
          fontFamily: "'Josefin Sans', sans-serif",
        }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr>
            {['Company', 'Category', 'Contact', 'Tier', 'Date', 'Status', 'Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: T.inkMute, padding: 32 }}>No applications found</td></tr>
          ) : filtered.map(a => (
            <tr key={a.id}>
              <td style={tdStyle}><strong>{a.company_name}</strong><br /><span style={{ fontSize: 10, color: T.inkMute }}>{a.email}</span></td>
              <td style={tdStyle}>{CATEGORY_LABELS[a.category] || a.category}</td>
              <td style={tdStyle}>{a.contact_name}{a.phone && <><br /><span style={{ fontSize: 10, color: T.inkMute }}>{a.phone}</span></>}</td>
              <td style={tdStyle}><span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: a.preferred_tier === 'annual' ? T.ochre : T.terra }}>{a.preferred_tier}</span></td>
              <td style={{ ...tdStyle, fontSize: 11 }}>{fmtDate(a.created_at)}</td>
              <td style={tdStyle}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: a.status === 'pending' ? T.warning : a.status === 'approved' ? T.success : T.danger,
                }}>
                  {a.status}
                </span>
              </td>
              <td style={tdStyle}>
                {a.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ActionBtn label="Approve" color={T.success} onClick={() => approveApp(a.id)} />
                    <ActionBtn label="Reject" color={T.danger} onClick={() => rejectApp(a.id)} />
                  </div>
                ) : (
                  <span style={{ fontSize: 10, color: T.inkMute }}>{a.reviewed_at ? fmtDate(a.reviewed_at) : '—'}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DirListingsPanel({ providers, showToast, onReload }: {
  providers: Provider[]
  showToast: (msg: string, type?: string) => void
  onReload: () => void
}) {
  const [filter, setFilter] = useState('')
  const filtered = filter ? providers.filter(p => p.category === filter) : providers

  async function toggleStatus(id: string, newStatus: string) {
    const sb = getSupabase()
    const { error } = await sb.from('directory_providers').update({ status: newStatus }).eq('id', id)
    if (error) { showToast('Failed: ' + error.message, 'error'); return }
    showToast(`Provider ${newStatus === 'active' ? 'activated' : 'paused'}`, 'success')
    onReload()
  }

  async function removeProvider(id: string) {
    if (!confirm('Remove this provider? This cannot be undone.')) return
    const sb = getSupabase()
    const { error } = await sb.from('directory_providers').delete().eq('id', id)
    if (error) { showToast('Failed: ' + error.message, 'error'); return }
    showToast('Provider removed', 'info')
    onReload()
  }

  // Stats
  const active = providers.filter(p => p.status === 'active')
  const annual = active.filter(p => p.tier === 'annual')
  const cohort = active.filter(p => p.tier === 'cohort')
  const revenue = annual.length * 1_500_000 + cohort.length * 500_000

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{
          background: '#fff', border: `1px solid ${T.rule}`, borderLeft: `3px solid ${T.terra}`,
          color: T.ink, padding: '8px 12px', fontSize: 12, fontFamily: "'Josefin Sans', sans-serif",
        }}>
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span style={{ fontSize: 12, color: T.inkMute }}>
          <strong>{active.length}</strong> of 24 slots {'·'} <strong>{annual.length}</strong> annual {'·'} <strong>{cohort.length}</strong> per-cohort {'·'} Est. revenue: <strong style={{ color: T.ochre }}>{fmtUGX(revenue)}</strong>
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: T.inkMute, padding: 32, gridColumn: '1 / -1' }}>No listings found</div>
        ) : filtered.map(p => {
          const now = new Date()
          const exp = new Date(p.expires_at)
          const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000)

          return (
            <div key={p.id} style={{
              background: '#fff', border: `1px solid ${T.rule}`, padding: 20,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.terra, marginBottom: 8 }}>
                {CATEGORY_LABELS[p.category] || p.category} {'·'} Slot {p.position}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{p.company_name} {p.featured ? '⭐' : ''}</div>
              <div style={{ fontSize: 11, color: T.inkMute, marginBottom: 12, lineHeight: 1.5 }}>
                {p.description || '—'}<br />{p.contact_name || ''} {'·'} {p.email || ''}
              </div>
              <span style={{
                display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '3px 8px', marginRight: 6,
                background: p.tier === 'annual' ? 'rgba(201,146,58,0.15)' : 'rgba(200,83,31,0.1)',
                color: p.tier === 'annual' ? T.ochre : T.terra,
              }}>
                {p.tier === 'annual' ? 'Annual' : 'Per Cohort'}
              </span>
              <span style={{
                fontSize: 10, color: daysLeft < 0 ? T.danger : daysLeft < 14 ? T.warning : T.inkMute,
                fontWeight: daysLeft < 14 ? 700 : 400,
              }}>
                {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d remaining`}
              </span>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <ActionBtn
                  label={p.status === 'active' ? 'Pause' : 'Activate'}
                  color={T.ochre}
                  onClick={() => toggleStatus(p.id, p.status === 'active' ? 'paused' : 'active')}
                />
                <ActionBtn label="Remove" color={T.danger} onClick={() => removeProvider(p.id)} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COACH APPLICATIONS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function CoachAppsTab({ apps, reviewerEmail, showToast, onReload }: {
  apps: CoachApp[]
  reviewerEmail: string
  showToast: (msg: string, type?: string) => void
  onReload: () => void
}) {
  const [filter, setFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = filter ? apps.filter(a => a.status === filter) : apps

  async function castVote(id: string, vote: string, reason?: string) {
    const app = apps.find(a => a.id === id)
    const name = app ? `${app.first_name} ${app.last_name}` : 'this applicant'

    if (vote === 'approve') {
      if (!confirm(`Cast your APPROVE vote for ${name}?\n\nThe application needs ${app?.required_approvals || 4} total approvals.`)) return
    }

    try {
      const sb = getSupabase()
      const session = await sb.auth.getSession()
      const token = session?.data?.session?.access_token || ''
      const res = await fetch(`${API_BASE}/api/admin/coach-applications/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ vote, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Vote failed')

      if (data.status === 'approved') {
        showToast(`All ${data.required} approvals received — ${name} is approved!`, 'success')
      } else if (data.status === 'rejected') {
        showToast(`Application rejected — notification sent.`, 'info')
      } else {
        showToast(`Vote recorded (${data.approvals}/${data.required})`, 'success')
      }
      onReload()
    } catch (err: any) {
      showToast('Vote failed: ' + err.message, 'error')
    }
  }

  const thStyle: React.CSSProperties = {
    background: T.paper, color: T.inkMute, padding: '11px 14px',
    textAlign: 'left', fontSize: 9, letterSpacing: '0.15em',
    textTransform: 'uppercase', fontWeight: 700, borderBottom: `1px solid ${T.rule}`,
  }
  const tdStyle: React.CSSProperties = { padding: '12px 14px', borderBottom: `1px solid rgba(26,26,26,0.06)`, verticalAlign: 'middle' }

  return (
    <div>
      <SectionHead title="Coach Applications" />
      <div style={{ marginBottom: 16 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{
          background: '#fff', border: `1px solid ${T.rule}`, borderLeft: `3px solid ${T.terra}`,
          color: T.ink, padding: '8px 12px', fontSize: 12, fontFamily: "'Josefin Sans', sans-serif",
        }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr>
            {['Name', 'Email', 'Discipline', 'Headline', 'Approvals', 'Date', 'Status'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: T.inkMute, padding: 32 }}>No coach applications found</td></tr>
          ) : filtered.map(a => {
            const votes = a.votes || []
            const approvals = votes.filter(v => v.vote === 'approve').length
            const required = a.required_approvals || 4
            const isExpanded = expandedId === a.id

            return (
              <React.Fragment key={a.id}>
                <tr
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={tdStyle}><strong>{(a.first_name || '') + ' ' + (a.last_name || '')}</strong></td>
                  <td style={{ ...tdStyle, fontSize: 11 }}>{a.email || '—'}</td>
                  <td style={tdStyle}>{L1_LABELS[a.taxonomy_l1 || ''] || a.taxonomy_l1 || '—'}</td>
                  <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.headline || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {a.status === 'pending' ? (
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif", fontSize: 13,
                        color: approvals >= required ? T.success : T.inkMute,
                      }}>
                        {approvals}/{required}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 11 }}>{a.created_at ? fmtDate(a.created_at) : '—'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: a.status === 'pending' ? T.warning : a.status === 'approved' ? T.success : T.danger,
                    }}>
                      {a.status}
                    </span>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <CoachAppDetail
                        app={a}
                        reviewerEmail={reviewerEmail}
                        onVote={castVote}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── COACH APP DETAIL PANEL ───────────────────────────────────────────────────
function CoachAppDetail({ app, reviewerEmail, onVote }: {
  app: CoachApp
  reviewerEmail: string
  onVote: (id: string, vote: string, reason?: string) => void
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const votes = app.votes || []
  const approvals = votes.filter(v => v.vote === 'approve')
  const rejections = votes.filter(v => v.vote === 'reject')
  const required = app.required_approvals || 4
  const myVote = votes.find(v => v.reviewer_email === reviewerEmail)
  const isMyApp = reviewerEmail && app.email && reviewerEmail.toLowerCase() === app.email.toLowerCase()
  const pct = Math.round((approvals.length / required) * 100)

  const gridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px',
    fontSize: 12, marginBottom: 16,
  }

  return (
    <div style={{ padding: '16px 20px', background: '#fff', borderTop: `1px solid ${T.rule}` }}>
      <div style={gridStyle}>
        <div><strong>Phone:</strong> {(app.country_code || '') + ' ' + (app.phone || '—')}</div>
        <div><strong>Current role:</strong> {app.current_role || '—'}</div>
        <div><strong>Geographies:</strong> {app.geographies || '—'}</div>
        <div><strong>Assigned day:</strong> {app.assigned_day || '—'}</div>
        <div><strong>L2 sub-categories:</strong> {(app.taxonomy_l2 || []).join(', ') || '—'}</div>
        <div><strong>L3 specialties:</strong> {(app.taxonomy_l3 || []).join(', ') || '—'}</div>
        <div><strong>Session types:</strong> {(app.session_types || []).join(', ') || '—'}</div>
        <div><strong>Time slots:</strong> {(app.time_slots || []).join(', ') || '—'}</div>
        <div><strong>Has existing materials:</strong> {app.has_existing_materials || '—'}</div>
      </div>

      {app.bio && <div style={{ marginBottom: 12 }}><strong>Bio:</strong><br /><span style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{app.bio}</span></div>}
      {app.experience && <div style={{ marginBottom: 12 }}><strong>Experience:</strong><br /><span style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{app.experience}</span></div>}
      {app.notable_clients && <div style={{ marginBottom: 12 }}><strong>Notable clients:</strong><br /><span style={{ fontSize: 12 }}>{app.notable_clients}</span></div>}
      {app.coaching_philosophy && <div style={{ marginBottom: 12 }}><strong>Coaching philosophy:</strong><br /><span style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{app.coaching_philosophy}</span></div>}

      {/* Approval progress */}
      {(votes.length > 0 || app.status === 'pending') && (
        <div style={{
          margin: '16px 0 12px', padding: '12px 16px', background: T.paper, border: `1px solid ${T.rule}`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
            color: T.terra, marginBottom: 10,
          }}>
            Peer Review {'—'} {approvals.length} of {required} approvals
          </div>
          <div style={{ height: 6, background: T.rule, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: rejections.length ? T.danger : approvals.length >= required ? T.success : T.ochre,
              transition: 'width 0.3s',
            }} />
          </div>
          {votes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {votes.map((v, i) => {
                const isApprove = v.vote === 'approve'
                return (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                    background: isApprove ? 'rgba(10,143,100,0.08)' : 'rgba(220,53,69,0.08)',
                    border: `1px solid ${isApprove ? T.success : T.danger}`, fontSize: 11,
                  }}>
                    <span style={{ color: isApprove ? T.success : T.danger, fontWeight: 700 }}>
                      {isApprove ? '✓' : '✗'}
                    </span>
                    <span>{v.reviewer_name || v.reviewer_email}</span>
                    {v.created_at && <span style={{ color: T.inkMute, fontSize: 10 }}>{fmtDate(v.created_at)}</span>}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Vote buttons */}
      {app.status === 'pending' && (
        isMyApp ? (
          <div style={{ marginTop: 12, padding: '10px 16px', background: `rgba(201,146,58,0.08)`, fontSize: 12, color: T.inkMute }}>
            This is your application {'—'} waiting for peer reviews.
          </div>
        ) : myVote ? (
          <div style={{
            marginTop: 12, padding: '10px 16px',
            background: myVote.vote === 'approve' ? 'rgba(10,143,100,0.08)' : 'rgba(220,53,69,0.08)',
            fontSize: 12,
          }}>
            You voted to <strong>{myVote.vote}</strong> this application{myVote.created_at ? ` on ${fmtDate(myVote.created_at)}` : ''}.
          </div>
        ) : !showRejectForm ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button onClick={() => onVote(app.id, 'approve')} style={{
              background: T.success, color: '#fff', border: 'none', padding: '8px 20px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer',
            }}>
              Approve
            </button>
            <button onClick={() => setShowRejectForm(true)} style={{
              background: 'transparent', border: `1px solid ${T.danger}`, color: T.danger,
              padding: '8px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer',
            }}>
              Reject
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Rejection reason (sent to applicant if application is rejected):
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              style={{
                width: '100%', maxWidth: 500, padding: 8, border: `1px solid ${T.rule}`,
                fontFamily: "'Josefin Sans', sans-serif", fontSize: 12, background: T.paper, resize: 'vertical',
              }}
              placeholder="Explain why you think this application should not be accepted..."
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
              <button onClick={() => {
                if (!rejectReason.trim()) { return }
                if (!confirm(`Cast your REJECT vote? This will immediately reject the application.`)) return
                onVote(app.id, 'reject', rejectReason)
              }} style={{
                background: T.danger, color: '#fff', border: 'none', padding: '8px 20px',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer',
              }}>
                Confirm Rejection
              </button>
              <button onClick={() => setShowRejectForm(false)} style={{
                background: 'transparent', border: `1px solid ${T.rule}`, color: T.inkMute,
                padding: '8px 20px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                fontFamily: "'Josefin Sans', sans-serif", cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
