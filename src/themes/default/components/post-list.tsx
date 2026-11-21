import type { PostListProps } from '@/themes/engine'
import { PostCard } from './post-card'

export function PostList({ posts, timeZone, dateFormat }: PostListProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          {...(timeZone && { timeZone })}
          {...(dateFormat && { dateFormat })}
        />
      ))}
    </div>
  )
}
