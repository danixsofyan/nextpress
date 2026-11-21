import { logger } from './logger'

const REPO_URL = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/

export function githubRepo(href: string) {
  const match = REPO_URL.exec(href)
  return match ? `${match[1]}/${match[2]}` : null
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export const formatStars = (count: number) => compact.format(count)

export async function githubStars(repo: string) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'nextpress' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      logger.warn('github stars unavailable', { repo, status: res.status })
      return null
    }
    const data = (await res.json()) as { stargazers_count?: unknown }
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null
  } catch (err) {
    logger.warn('github stars request failed', { repo, err })
    return null
  }
}
