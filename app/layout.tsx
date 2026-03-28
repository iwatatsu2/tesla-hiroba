import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const noto = Noto_Sans_JP({ subsets: ['latin'], weight: ['400','500','700'], display: 'swap' })

export const metadata: Metadata = {
  title: 'TSLA PARK – テスラオーナーコミュニティ',
  description: 'テスラオーナーのための情報共有・充電マップ・納車トラッカー',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: `${inter.style.fontFamily}, ${noto.style.fontFamily}, sans-serif` }}>
        <Nav />
        <main style={{ paddingTop: 60, minHeight: '100vh' }}>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
