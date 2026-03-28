import { Suspense } from 'react'
import PostsSection from '@/components/PostsSection'
import NewsSection from '@/components/NewsSection'

export default function Home() {
  return (
    <div>
      {/* ニュース（一番上） */}
      <NewsSection />

      {/* コミュニティ投稿 */}
      <div style={{ borderTop: '1px solid #f0f0f0' }}>
        <Suspense>
          <PostsSection />
        </Suspense>
      </div>
    </div>
  )
}
