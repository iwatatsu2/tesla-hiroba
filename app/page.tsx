import { Suspense } from 'react'
import PostsSection from '@/components/PostsSection'
import XTimeline from '@/components/XTimeline'

export default function Home() {
  return (
    <Suspense>
      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <PostsSection />
        </div>
        <aside style={{ width: 300, flexShrink: 0, padding: '24px 16px', display: 'none' }} className="x-sidebar">
          <XTimeline />
        </aside>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .x-sidebar { display: block !important; }
        }
      `}</style>
    </Suspense>
  )
}
