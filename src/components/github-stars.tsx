import { formatStars, githubRepo, githubStars } from '@/lib/github'

export async function GithubStars({ href, className }: { href: string; className: string }) {
  const repo = githubRepo(href)
  const stars = repo ? await githubStars(repo) : null
  if (stars === null) return null
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${className}`}
      aria-label={`${stars} GitHub stars`}
    >
      {formatStars(stars)}
    </span>
  )
}
