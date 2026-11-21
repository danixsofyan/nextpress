import { CaptchaWidget } from '@/components/captcha-widget'
import { db } from '@/lib/db'
import { getCaptcha } from '@/lib/plugins'
import { getSiteSettings } from '@/lib/site'
import { formatDate } from '@/themes/engine'
import { CommentRepository } from '@/server'

const input =
  'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

async function CommentForm({ postId, parentId }: { postId: string; parentId?: string }) {
  const captcha = await getCaptcha()
  const id = parentId ? `reply-${parentId}` : 'comment'
  return (
    <form method="post" action="/api/comments" className="space-y-4">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor={`${id}-name`} className="text-sm font-medium">
          Name
        </label>
        <input
          id={`${id}-name`}
          name="authorName"
          required
          maxLength={80}
          autoComplete="name"
          className={`${input} h-10`}
        />
      </div>
      <div>
        <label htmlFor={`${id}-content`} className="text-sm font-medium">
          {parentId ? 'Reply' : 'Comment'}
        </label>
        <textarea
          id={`${id}-content`}
          name="content"
          required
          maxLength={2000}
          rows={parentId ? 3 : 5}
          className={input}
        />
      </div>
      {captcha && <CaptchaWidget provider={captcha.provider} siteKey={captcha.siteKey} lazy />}
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {parentId ? 'Post reply' : 'Post comment'}
      </button>
    </form>
  )
}

export async function CommentsSection({ postId }: { postId: string }) {
  const [site, all] = await Promise.all([
    getSiteSettings(),
    new CommentRepository(db).findApprovedForPost(postId),
  ])
  if (!site.commentsEnabled && all.length === 0) return null
  const top = all.filter((c) => !c.parentId)
  const replies = (id: string) => all.filter((c) => c.parentId === id)
  const date = (d: Date) => formatDate(d, site.dateFormat, site.timeZone)

  return (
    <section id="comments" className="mx-auto mt-16 max-w-2xl border-t pt-10">
      <h2 className="text-2xl font-bold tracking-tight">
        {all.length === 0 ? 'Comments' : `${all.length} comment${all.length === 1 ? '' : 's'}`}
      </h2>
      <p
        id="comment-pending"
        role="status"
        className="mt-4 hidden rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm target:block"
      >
        Thanks! Your comment is awaiting moderation.
      </p>
      <p
        id="comment-error"
        role="alert"
        className="mt-4 hidden rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm target:block"
      >
        Your comment could not be posted. Check the fields and the security check, then try again in
        a minute.
      </p>
      <ol className="mt-6 space-y-6">
        {top.map((comment) => (
          <li key={comment.id} id={`comment-${comment.id}`} className="scroll-mt-24">
            <article className="rounded-lg border bg-card p-4">
              <header className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-semibold">{comment.authorName}</span>
                <time dateTime={comment.createdAt.toISOString()} className="text-muted-foreground">
                  {date(comment.createdAt)}
                </time>
              </header>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{comment.content}</p>
              {site.commentsEnabled && (
                <details className="mt-3">
                  <summary className="text-sm font-medium text-primary hover:underline">
                    Reply
                  </summary>
                  <div className="mt-3">
                    <CommentForm postId={postId} parentId={comment.id} />
                  </div>
                </details>
              )}
            </article>
            {replies(comment.id).length > 0 && (
              <ol className="mt-3 ml-6 space-y-3 border-l pl-4">
                {replies(comment.id).map((reply) => (
                  <li key={reply.id} id={`comment-${reply.id}`} className="scroll-mt-24">
                    <article className="rounded-lg border bg-card p-4">
                      <header className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <span className="font-semibold">{reply.authorName}</span>
                        <time
                          dateTime={reply.createdAt.toISOString()}
                          className="text-muted-foreground"
                        >
                          {date(reply.createdAt)}
                        </time>
                      </header>
                      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
                        {reply.content}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
      {site.commentsEnabled ? (
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold">Leave a comment</h3>
          <CommentForm postId={postId} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Comments are closed.</p>
      )}
    </section>
  )
}
