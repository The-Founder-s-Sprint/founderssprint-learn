'use client'

const T = {
  ink: '#1A1A1A', inkMute: '#5A564F', paper: '#EFE7D8',
  terra: '#C8531F', terraDeep: '#9A3E16', rule: 'rgba(26,26,26,0.18)',
}

function V6Mark({ size = 44 }: { size?: number }) {
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
        <polygon key={i} points="50,8 57,50 50,92 43,50" fill={p.hex} opacity={p.opacity} transform={`rotate(${p.angle} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="4.5" fill={T.ink} />
      <circle cx="50" cy="50" r="2" fill={T.paper} />
    </svg>
  )
}

export default function NotEnrolledPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
      `}</style>
      <div style={{
        minHeight: '100vh', background: T.ink, display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', Georgia, serif", padding: '24px',
      }}>
        <div style={{ background: T.paper, maxWidth: '440px', width: '100%', padding: '48px 40px 40px', textAlign: 'center' as const }}>
          <div style={{ marginBottom: '32px' }}><V6Mark /></div>
          <span style={{
            fontFamily: "'Josefin Sans', sans-serif", fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: T.terra,
            display: 'block', marginBottom: '8px',
          }}>Access Restricted</span>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300,
            fontSize: '38px', lineHeight: 1.1, color: T.ink, marginBottom: '16px',
          }}>You're Not Yet<br /><em>Enrolled</em></h1>
          <p style={{
            fontSize: '17px', color: T.inkMute, lineHeight: 1.75, marginBottom: '32px',
          }}>
            Your email isn't on our participant list for the current cohort.
            To enrol, visit founderssprint.co to register for an upcoming sprint.
          </p>
          <a
            href="https://founderssprint.co"
            style={{
              display: 'inline-block', padding: '16px 32px', background: T.terra, color: T.paper,
              fontFamily: "'Josefin Sans', sans-serif", fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase' as const, textDecoration: 'none',
            }}
          >
            Register at founderssprint.co
          </a>
          <div style={{ height: '1px', background: `linear-gradient(to right, transparent, ${T.rule}, transparent)`, margin: '28px 0' }} />
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '14px', fontStyle: 'italic' as const, color: T.terra, opacity: 0.5,
          }}>Build with direction.</p>
        </div>
      </div>
    </>
  )
}
