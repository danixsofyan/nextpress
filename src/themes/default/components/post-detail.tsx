import Image from 'next/image'
import Link from 'next/link'
import { formatDate, isOptimizableImage, type PostDetailProps } from '@/themes/engine'

export function PostDetail({ post, timeZone, dateFormat, relatedPosts = [] }: PostDetailProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 space-y-4">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All posts
        </Link>
        <h1 className="text-3xl leading-tight font-bold tracking-tight">{post.title}</h1>
        {post.excerpt && (
          <p className="text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt.toISOString()}
            className="block text-sm text-muted-foreground"
          >
            {formatDate(post.publishedAt, dateFormat, timeZone)}
          </time>
        )}
      </div>

      {post.coverImage && (
        <Image
          src={post.coverImage}
          alt={post.title}
          width={1344}
          height={768}
          sizes="(min-width: 768px) 672px, 100vw"
          priority
          unoptimized={!isOptimizableImage(post.coverImage)}
          className="mb-8 max-h-96 w-full rounded-xl object-cover"
        />
      )}

      <div
        className="prose max-w-none prose-neutral dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {relatedPosts.length > 0 && (
        <aside className="mt-16 space-y-4 border-t pt-8">
          <h2 className="text-xl font-semibold">Related Posts</h2>
          <ul className="space-y-3">
            {relatedPosts.map((p) => (
              <li key={p.id}>
                <a
                  href={`/blog/${p.slug}`}
                  className="text-sm font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  {p.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}
