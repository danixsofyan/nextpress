import { isOptimizableImage } from '@/themes/engine'
import Image from 'next/image'
import { type PostCardProps, formatDate } from '@/themes/engine'

export function PostCard({ post, timeZone, dateFormat }: PostCardProps) {
  return (
    <article className="group grid gap-6 py-8 sm:grid-cols-[1fr_220px]">
      <div className="space-y-3">
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt.toISOString()}
            className="text-xs tracking-widest text-primary uppercase"
          >
            {formatDate(post.publishedAt, dateFormat, timeZone)}
          </time>
        )}
        <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
          <a href={`/blog/${post.slug}`} className="transition-colors group-hover:text-primary">
            {post.title}
          </a>
        </h2>
        {post.excerpt && (
          <p className="text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}
        <a
          href={`/blog/${post.slug}`}
          className="inline-block text-sm font-semibold tracking-widest text-primary uppercase underline-offset-4 hover:underline"
        >
          Read more →
        </a>
      </div>
      {post.coverImage && (
        <Image
          src={post.coverImage}
          alt={post.title}
          width={440}
          height={320}
          sizes="(min-width: 640px) 220px, 100vw"
          unoptimized={!isOptimizableImage(post.coverImage)}
          className="order-first h-40 w-full rounded-md object-cover sm:order-none sm:h-full"
        />
      )}
    </article>
  )
}
