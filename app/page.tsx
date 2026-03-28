import { Suspense } from 'react'
import PostsSection from '@/components/PostsSection'

export default function Home() {
  return (
    <Suspense>
      <PostsSection />
    </Suspense>
  )
}
