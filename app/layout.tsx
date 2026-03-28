import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'TESLA HIROBA',
  description: 'テスラオーナー向け情報共有コミュニティ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Nav />
        <main style={{ paddingTop: 64 }}>{children}</main>
      </body>
    </html>
  )
}
