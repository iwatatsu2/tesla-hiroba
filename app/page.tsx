import { Suspense } from 'react'
import PostsSection from '@/components/PostsSection'
import NewsSection from '@/components/NewsSection'

export default function Home() {
  return (
    <div>
      <Suspense>
        <PostsSection />
      </Suspense>
      <div style={{ borderTop: '1px solid #f0f0f0' }}>
        <NewsSection />
      </div>
    </div>
  )
}
