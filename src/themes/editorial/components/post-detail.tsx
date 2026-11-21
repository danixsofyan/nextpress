import Image from 'next/image'
import Link from 'next/link'
import { formatDate, isOptimizableImage, type PostDetailProps } from '@/themes/engine'

export function PostDetail({ post, timeZone, dateFormat, author }: PostDetailProps) {
  return (
    <article className="mx-auto max-w-2xl">
      <header className="mb-10 space-y-5 text-center">
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt.toISOString()}
            className="text-xs tracking-widest text-primary uppercase"
          >
            {formatDate(post.publishedAt, dateFormat, timeZone)}
          </time>
        )}
        <h1 className="text-4xl leading-tight font-bold sm:text-5xl">{post.title}</h1>
        {post.excerpt && (
          <p className="text-xl leading-relaxed text-muted-foreground italic">{post.excerpt}</p>
        )}
        {author && (
          <p className="text-sm text-muted-foreground">
            By{' '}
            <Link href={author.href} className="font-semibold text-foreground hover:text-primary">
              {author.name}
            </Link>
          </p>
        )}
      </header>

      {post.coverImage && (
        <Image
          src={post.coverImage}
          alt={post.title}
          width={1344}
          height={896}
          sizes="(min-width: 768px) 672px, 100vw"
          priority
          unoptimized={!isOptimizableImage(post.coverImage)}
          className="mb-10 max-h-[28rem] w-full rounded-md object-cover"
        />
      )}

      <div
        className="prose prose-lg max-w-none prose-neutral prose-headings:font-bold prose-a:text-primary [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:text-6xl [&>p:first-of-type]:first-letter:leading-none [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:text-primary"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <footer className="mt-16 border-t border-border pt-6 text-center">
        <Link
          href="/blog"
          className="text-sm font-semibold tracking-widest text-primary uppercase underline-offset-4 hover:underline"
        >
          ← Back to all stories
        </Link>
      </footer>
    </article>
  )
}
