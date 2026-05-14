import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "The Founder's Sprint — Curriculum",
  description: 'Your 5-week clarity programme. Expert guidance from idea to investor-ready pitch.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;1,300;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Josefin+Sans:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
