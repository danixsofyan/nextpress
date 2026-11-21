import type { PostListProps } from '@/themes/engine'
import { PostCard } from './post-card'

export function PostList({ posts, timeZone, dateFormat }: PostListProps) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
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
