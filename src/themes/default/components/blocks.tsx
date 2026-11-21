import { DONATION_MAX, DONATION_MIN } from '@/core/validators'
import { DONOR_MESSAGE_MAX, DONOR_NAME_MAX } from '@/lib/donation-input'
import { formatStars, githubRepo, githubStars } from '@/lib/github'
import type { Block, BlocksProps } from '@/themes/engine'
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  Download,
  FileText,
  Gauge,
  Github,
  Globe,
  Heart,
  Image,
  KeyRound,
  LayoutTemplate,
  Lock,
  Plus,
  type LucideIcon,
  Palette,
  Plug,
  Rocket,
  Rss,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Users,
  Zap,
} from 'lucide-react'
import { LottiePlayer } from '@/components/lottie-player'
import { PostCard } from './post-card'

const ICONS: Record<string, LucideIcon> = {
  bot: Bot,
  book: BookOpen,
  check: CheckCircle2,
  cloud: Cloud,
  code: Code2,
  database: Database,
  download: Download,
  'file-text': FileText,
  gauge: Gauge,
  github: Github,
  globe: Globe,
  heart: Heart,
  image: Image,
  key: KeyRound,
  layout: LayoutTemplate,
  lock: Lock,
  palette: Palette,
  plug: Plug,
  rocket: Rocket,
  rss: Rss,
  search: Search,
  settings: Settings,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  upload: Upload,
  users: Users,
  zap: Zap,
}

type LinkValue = { label: string; href: string }

const external = (href: string) =>
  /^https?:\/\//.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}

async function StarCount({ href, className }: { href: string; className: string }) {
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

function ButtonLink({ link, variant }: { link: LinkValue; variant: 'primary' | 'secondary' }) {
  return (
    <a
      href={link.href}
      {...external(link.href)}
      className={
        variant === 'primary'
          ? 'np-glow-button group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5'
          : 'np-glass inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors duration-300 hover:bg-accent'
      }
    >
      {link.label}
      <StarCount
        href={link.href}
        className={variant === 'primary' ? 'bg-primary-foreground/20' : 'bg-foreground/10'}
      />
      {variant === 'primary' && (
        <ArrowRight
          className="size-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        />
      )}
    </a>
  )
}

function SectionHeading({
  heading,
  intro,
}: {
  heading?: string | undefined
  intro?: string | undefined
}) {
  if (!heading && !intro) return null
  return (
    <div className="np-reveal mx-auto mb-12 max-w-2xl text-center">
      {heading && (
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{heading}</h2>
      )}
      {intro && <p className="mt-4 text-lg text-pretty text-muted-foreground">{intro}</p>}
    </div>
  )
}

const GRID: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

const STEP_GRID: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const field =
  'mt-1.5 w-full rounded-xl border bg-background/60 px-3.5 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--color-glow-1)]'

function DonateForm({ block }: { block: Extract<Block, { type: 'donate' }> }) {
  const amounts = [...new Set(block.amounts)].sort((a, b) => a - b)
  return (
    <section className="relative py-16">
      <div className="np-bleed">
        <div className="absolute top-1/2 left-1/2 size-[36rem] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-glow-2)_22%,transparent),transparent)]" />
      </div>
      <div className="np-reveal np-ring np-glass mx-auto max-w-xl rounded-3xl border p-6 text-center shadow-xl shadow-black/5 sm:p-10">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-glow-1)] to-[var(--color-glow-2)] text-white shadow-lg">
          <Heart className="size-6" aria-hidden />
        </div>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-balance">{block.heading}</h2>
        {block.text && <p className="mt-3 text-pretty text-muted-foreground">{block.text}</p>}
        <form method="post" action="/api/donate" className="mt-8 space-y-5 text-left">
          <fieldset>
            <legend className="sr-only">Choose an amount</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {amounts.map((amount, i) => (
                <label
                  key={amount}
                  className="rounded-xl border px-3 py-3 text-center text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent has-checked:border-transparent has-checked:bg-gradient-to-br has-checked:from-[var(--color-glow-1)] has-checked:to-[var(--color-glow-2)] has-checked:text-white has-checked:shadow-lg has-focus-visible:ring-2 has-focus-visible:ring-ring"
                >
                  <input
                    type="radio"
                    name="amount"
                    value={amount}
                    defaultChecked={i === 0}
                    className="sr-only"
                  />
                  {rupiah.format(amount)}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="donate-custom" className="text-sm font-medium">
              Or enter another amount (IDR)
            </label>
            <input
              id="donate-custom"
              name="custom"
              type="number"
              inputMode="numeric"
              min={DONATION_MIN}
              max={DONATION_MAX}
              step={1000}
              placeholder={String(amounts[0])}
              className={`${field} h-11`}
            />
          </div>
          <div>
            <label htmlFor="donate-name" className="text-sm font-medium">
              Your name
            </label>
            <input
              id="donate-name"
              name="name"
              type="text"
              required
              maxLength={DONOR_NAME_MAX}
              autoComplete="name"
              className={`${field} h-11`}
            />
          </div>
          <div>
            <label htmlFor="donate-message" className="text-sm font-medium">
              Message <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="donate-message"
              name="message"
              rows={3}
              maxLength={DONOR_MESSAGE_MAX}
              className={`${field} py-2.5`}
            />
          </div>
          <button
            type="submit"
            className="np-glow-button inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5"
          >
            <Heart className="size-4" aria-hidden />
            {block.buttonLabel ?? 'Donate with QRIS'}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Payment is processed securely by SumoPod. Any QRIS-enabled banking or e-wallet app
            works.
          </p>
        </form>
      </div>
    </section>
  )
}

function BlockView({
  block,
  posts,
  timeZone,
  dateFormat,
  donations,
}: { block: Block } & Omit<BlocksProps, 'blocks'>) {
  switch (block.type) {
    case 'hero':
      return (
        <section className="relative isolate pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
          <div className="np-bleed -top-10">
            <div className="np-aurora absolute inset-0" />
            <div className="np-grid absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
          </div>
          {block.eyebrow && (
            <p className="np-rise np-ring np-glass mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium">
              <Sparkles className="size-3.5 text-[var(--color-glow-1)]" aria-hidden />
              {block.eyebrow}
            </p>
          )}
          <h1 className="np-gradient-text mx-auto max-w-4xl text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {block.heading}
          </h1>
          {block.subheading && (
            <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
              {block.subheading}
            </p>
          )}
          {(block.primary || block.secondary) && (
            <div
              className="np-rise mt-10 flex flex-wrap justify-center gap-3"
              style={{ animationDelay: '150ms' }}
            >
              {block.primary && <ButtonLink link={block.primary} variant="primary" />}
              {block.secondary && <ButtonLink link={block.secondary} variant="secondary" />}
            </div>
          )}
        </section>
      )
    case 'features':
      return (
        <section className="py-16">
          <SectionHeading heading={block.heading} intro={block.intro} />
          <div className={`grid gap-5 ${GRID[block.columns ?? 3]}`}>
            {block.items.map((item) => {
              const Icon = item.icon ? ICONS[item.icon] : undefined
              return (
                <div
                  key={item.title}
                  className="np-reveal np-ring group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[color-mix(in_oklch,var(--color-glow-1)_12%,transparent)]"
                >
                  <div className="absolute -top-16 -right-16 size-40 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-glow-1)_25%,transparent),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  {Icon && (
                    <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-glow-1)] to-[var(--color-glow-2)] text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                      <Icon className="size-5" aria-hidden />
                    </div>
                  )}
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )
    case 'steps':
      return (
        <section className="py-16">
          <SectionHeading heading={block.heading} />
          <ol className={`relative grid gap-5 ${STEP_GRID[Math.min(block.items.length, 4)] ?? ''}`}>
            {block.items.map((item, index) => (
              <li
                key={item.title}
                className="np-reveal np-ring np-glass relative rounded-2xl border p-6"
              >
                <span className="np-accent-text block text-5xl leading-none font-black tracking-tighter">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )
    case 'stats':
      return (
        <section className="py-12">
          <SectionHeading heading={block.heading} />
          <dl className="np-reveal np-ring np-glass grid grid-cols-2 rounded-3xl border text-center lg:grid-cols-4 lg:divide-x">
            {block.items.map((item) => (
              <div key={item.label} className="flex flex-col-reverse gap-1 p-6 sm:p-8">
                <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
                <dd className="np-accent-text text-4xl font-extrabold tracking-tight">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )
    case 'code':
      return (
        <section className="py-16">
          <SectionHeading heading={block.heading} intro={block.intro} />
          <figure className="np-reveal relative mx-auto max-w-3xl">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-r from-[color-mix(in_oklch,var(--color-glow-1)_30%,transparent)] via-[color-mix(in_oklch,var(--color-glow-2)_20%,transparent)] to-[color-mix(in_oklch,var(--color-glow-3)_30%,transparent)] blur-2xl" />
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="size-3 rounded-full bg-[#ff5f57]" />
                <span className="size-3 rounded-full bg-[#febc2e]" />
                <span className="size-3 rounded-full bg-[#28c840]" />
                {block.language && (
                  <span className="ml-auto font-mono text-xs text-neutral-400">
                    {block.language}
                  </span>
                )}
              </div>
              <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-neutral-100">
                <code {...(block.language && { 'data-language': block.language })}>
                  {block.code}
                </code>
              </pre>
            </div>
            {block.caption && (
              <figcaption className="mt-4 text-center text-sm text-muted-foreground">
                {block.caption}
              </figcaption>
            )}
          </figure>
        </section>
      )
    case 'table':
      return (
        <section className="py-16">
          <SectionHeading heading={block.heading} intro={block.intro} />
          <div className="np-reveal np-ring overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="bg-gradient-to-r from-[color-mix(in_oklch,var(--color-glow-1)_10%,transparent)] to-[color-mix(in_oklch,var(--color-glow-2)_10%,transparent)]">
                  {block.columns.map((column) => (
                    <th key={column} className="px-5 py-4 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join('|')} className="border-t transition-colors hover:bg-muted/50">
                    {block.columns.map((column, i) => (
                      <td
                        key={column}
                        className={`px-5 py-4 ${i === 0 ? 'font-medium' : 'text-muted-foreground'}`}
                      >
                        {row[i] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )
    case 'faq':
      return (
        <section className="py-16">
          <SectionHeading heading={block.heading} />
          <div className="mx-auto grid max-w-3xl gap-3">
            {block.items.map((item) => (
              <details
                key={item.question}
                className="np-reveal np-ring group rounded-2xl border bg-card px-5 py-4 open:shadow-lg"
              >
                <summary className="flex list-none items-center justify-between gap-4 font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <Plus
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )
    case 'cta':
      return (
        <section className="np-reveal relative isolate my-16 overflow-hidden rounded-3xl bg-neutral-950 px-6 py-16 text-center text-white ring-1 ring-white/10 sm:py-20">
          <div className="np-aurora absolute inset-0 -z-10 opacity-90" />
          <div className="np-grid absolute inset-0 -z-10 opacity-60 invert" />
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {block.heading}
          </h2>
          {block.text && (
            <p className="mx-auto mt-4 max-w-xl text-pretty text-white/70">{block.text}</p>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href={block.primary.href}
              {...external(block.primary.href)}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 shadow-[0_8px_30px_-6px_rgba(255,255,255,0.5)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              {block.primary.label}
              <StarCount href={block.primary.href} className="bg-neutral-950/10" />
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </a>
            {block.secondary && (
              <a
                href={block.secondary.href}
                {...external(block.secondary.href)}
                className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/15"
              >
                {block.secondary.label}
                <StarCount href={block.secondary.href} className="ml-2 bg-white/15" />
              </a>
            )}
          </div>
        </section>
      )
    case 'posts': {
      const list = (posts ?? []).slice(0, block.count)
      return (
        <section className="py-16">
          <SectionHeading heading={block.heading} />
          {list.length === 0 ? (
            <p className="text-center text-muted-foreground">No posts published yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((post) => (
                <div
                  key={post.id}
                  className="np-reveal transition-transform duration-300 hover:-translate-y-1"
                >
                  <PostCard
                    post={post}
                    {...(timeZone && { timeZone })}
                    {...(dateFormat && { dateFormat })}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )
    }
    case 'donate':
      return donations ? <DonateForm block={block} /> : null
    case 'lottie':
      return (
        <section className="relative py-16">
          <SectionHeading heading={block.heading} intro={block.intro} />
          <div className="np-reveal relative mx-auto -my-8 max-w-3xl">
            <div className="absolute inset-[10%] -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-glow-1)_25%,transparent),transparent)]" />
            <LottiePlayer src={block.src} label={block.label} loop={block.loop} />
          </div>
        </section>
      )
    case 'richText':
      return (
        <section
          className="mx-auto prose max-w-3xl py-8 prose-neutral dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      )
  }
}

export function Blocks({ blocks, ...rest }: BlocksProps) {
  return (
    <div>
      {blocks.map((block, index) => (
        <BlockView key={`${block.type}-${index}`} block={block} {...rest} />
      ))}
    </div>
  )
}
