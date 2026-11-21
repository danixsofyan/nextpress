import type { Block, BlocksProps } from '@/themes/engine'
import {
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
  Image,
  KeyRound,
  LayoutTemplate,
  Lock,
  type LucideIcon,
  Palette,
  Plug,
  Rocket,
  Rss,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Zap,
} from 'lucide-react'
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
  upload: Upload,
  users: Users,
  zap: Zap,
}

type LinkValue = { label: string; href: string }

function ButtonLink({ link, variant }: { link: LinkValue; variant: 'primary' | 'secondary' }) {
  const external = /^https?:\/\//.test(link.href)
  return (
    <a
      href={link.href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      className={
        variant === 'primary'
          ? 'inline-flex items-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          : 'inline-flex items-center rounded-md border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent'
      }
    >
      {link.label}
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
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {heading && <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>}
      {intro && <p className="mt-3 text-lg text-muted-foreground">{intro}</p>}
    </div>
  )
}

const GRID: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

function BlockView({
  block,
  posts,
  timeZone,
  dateFormat,
}: { block: Block } & Omit<BlocksProps, 'blocks'>) {
  switch (block.type) {
    case 'hero':
      return (
        <section className="py-16 text-center sm:py-24">
          {block.eyebrow && (
            <p className="mb-4 inline-block rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              {block.eyebrow}
            </p>
          )}
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            {block.heading}
          </h1>
          {block.subheading && (
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {block.subheading}
            </p>
          )}
          {(block.primary || block.secondary) && (
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {block.primary && <ButtonLink link={block.primary} variant="primary" />}
              {block.secondary && <ButtonLink link={block.secondary} variant="secondary" />}
            </div>
          )}
        </section>
      )
    case 'features':
      return (
        <section className="py-12">
          <SectionHeading heading={block.heading} intro={block.intro} />
          <div className={`grid gap-6 ${GRID[block.columns ?? 3]}`}>
            {block.items.map((item) => {
              const Icon = item.icon ? ICONS[item.icon] : undefined
              return (
                <div key={item.title} className="rounded-xl border bg-card p-6">
                  {Icon && (
                    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Icon className="size-5" />
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
        <section className="py-12">
          <SectionHeading heading={block.heading} />
          <ol className="mx-auto grid max-w-3xl gap-6">
            {block.items.map((item, index) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )
    case 'stats':
      return (
        <section className="py-12">
          <SectionHeading heading={block.heading} />
          <dl className="grid gap-6 rounded-xl border bg-card p-8 text-center sm:grid-cols-2 lg:grid-cols-4">
            {block.items.map((item) => (
              <div key={item.label}>
                <dt className="text-sm text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-3xl font-bold tracking-tight">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )
    case 'code':
      return (
        <section className="py-12">
          <SectionHeading heading={block.heading} intro={block.intro} />
          <figure className="mx-auto max-w-3xl">
            <pre className="overflow-x-auto rounded-xl bg-neutral-950 p-5 text-sm leading-relaxed text-neutral-100">
              <code {...(block.language && { 'data-language': block.language })}>{block.code}</code>
            </pre>
            {block.caption && (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                {block.caption}
              </figcaption>
            )}
          </figure>
        </section>
      )
    case 'table':
      return (
        <section className="py-12">
          <SectionHeading heading={block.heading} intro={block.intro} />
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  {block.columns.map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join('|')} className="border-t">
                    {block.columns.map((column, i) => (
                      <td key={column} className="px-4 py-3 text-muted-foreground">
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
        <section className="py-12">
          <SectionHeading heading={block.heading} />
          <div className="mx-auto max-w-3xl divide-y rounded-xl border">
            {block.items.map((item) => (
              <details key={item.question} className="group p-5">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  {item.question}
                </summary>
                <p className="mt-3 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )
    case 'cta':
      return (
        <section className="my-12 rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold tracking-tight">{block.heading}</h2>
          {block.text && <p className="mx-auto mt-3 max-w-xl opacity-80">{block.text}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={block.primary.href}
              className="inline-flex items-center rounded-md bg-primary-foreground px-6 py-2.5 text-sm font-medium text-primary transition-opacity hover:opacity-90"
            >
              {block.primary.label}
            </a>
            {block.secondary && (
              <a
                href={block.secondary.href}
                className="inline-flex items-center rounded-md border border-primary-foreground/40 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-primary-foreground/10"
              >
                {block.secondary.label}
              </a>
            )}
          </div>
        </section>
      )
    case 'posts': {
      const list = (posts ?? []).slice(0, block.count)
      return (
        <section className="py-12">
          <SectionHeading heading={block.heading} />
          {list.length === 0 ? (
            <p className="text-center text-muted-foreground">No posts published yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  {...(timeZone && { timeZone })}
                  {...(dateFormat && { dateFormat })}
                />
              ))}
            </div>
          )}
        </section>
      )
    }
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
