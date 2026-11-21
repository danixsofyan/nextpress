import { isOptimizableImage } from '@/themes/engine'
import Image from 'next/image'
import { formatDate, type PostCardProps } from '@/themes/engine'

export function PostCard({ post, timeZone, dateFormat }: PostCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      {post.coverImage && (
        <div className="overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={768}
            height={384}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={!isOptimizableImage(post.coverImage)}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="line-clamp-2 text-lg leading-snug font-semibold">
          <a href={`/blog/${post.slug}`} className="transition-colors hover:text-primary">
            {post.title}
          </a>
        </h2>
        {post.excerpt && (
          <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt.toISOString()}
            className="mt-auto border-t pt-2 text-xs text-muted-foreground"
          >
            {formatDate(post.publishedAt, dateFormat, timeZone)}
          </time>
        )}
      </div>
    </article>
  )
}
