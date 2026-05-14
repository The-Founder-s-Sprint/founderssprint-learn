const S = {
  page: { minHeight:'100vh', background:'#152B1F', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond', serif" } as React.CSSProperties,
  card: { background:'#F5EBD6', maxWidth:'480px', width:'100%', padding:'56px 48px', margin:'0 24px', textAlign:'center' as const },
  eyebrow: { fontFamily:"'Josefin Sans', sans-serif", fontSize:'10px', fontWeight:600, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'#B85A2E', marginBottom:'12px', display:'block' },
  title: { fontFamily:"'Cormorant', serif", fontWeight:300, fontSize:'36px', lineHeight:1.1, color:'#213A2D', marginBottom:'16px' },
  body: { fontSize:'17px', color:'#8C8880', lineHeight:1.75, marginBottom:'32px' },
  link: { display:'inline-block', fontFamily:"'Josefin Sans', sans-serif", fontSize:'11px', fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase' as const, color:'#B85A2E', textDecoration:'none', borderBottom:'2px solid #B85A2E', paddingBottom:'2px' },
}

export default function NotEnrolledPage() {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <span style={S.eyebrow}>Access Restricted</span>
        <h1 style={S.title}>You're not yet enrolled</h1>
        <p style={S.body}>
          Your email isn't on our participant list for the current cohort. To enrol, visit founderssprint.com to register for an upcoming sprint.
        </p>
        <a href="https://founderssprint.com" style={S.link}>Register at founderssprint.com →</a>
      </div>
    </div>
  )
}
