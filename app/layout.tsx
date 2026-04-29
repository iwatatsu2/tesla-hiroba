import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import PixelBar from '@/components/PixelBar'
import Footer from '@/components/Footer'
import StartScreen from '@/components/StartScreen'
import InstallBanner from '@/components/InstallBanner'

export const metadata: Metadata = {
  title: 'TSLA PARK',
  description: 'テスラオーナーのためのコミュニティ',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'TSLA' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TSLA" />
        <meta name="theme-color" content="#0A0A0A" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
      </head>
      <body>
        <StartScreen />
        <Nav />
        <main style={{ paddingTop: 60, minHeight: '100vh' }}>{children}</main>
        <PixelBar />
        <Footer />
        <InstallBanner />
      </body>
    </html>
  )
}
