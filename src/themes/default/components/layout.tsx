import { isOptimizableImage } from '@/themes/engine'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { GithubStars, LinkLabel } from '@/components/github-stars'
import { SchemeToggle } from '@/components/scheme-toggle'
import type { LayoutProps } from '@/themes/engine'

export function Layout({
  children,
  siteName,
  logo,
  navigation = [],
  footerLinks = [],
  footerWidgets,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
          >
            {logo ? (
              <Image
                src={logo}
                alt={siteName}
                width={200}
                height={32}
                priority
                unoptimized={!isOptimizableImage(logo)}
                className="h-8 w-auto max-w-[200px] object-contain"
              />
            ) : (
              siteName
            )}
          </Link>
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.href} className="group relative">
                <a
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  {...(item.children && { 'aria-haspopup': 'true' as const })}
                >
                  <LinkLabel href={item.href} label={item.label} />
                  <GithubStars href={item.href} className="bg-foreground/10 text-foreground" />
                  {item.children && <ChevronDown className="size-3.5" aria-hidden />}
                </a>
                {item.children && (
                  <ul className="invisible absolute top-full right-0 z-50 min-w-48 translate-y-1 rounded-lg border bg-popover p-1 opacity-0 shadow-lg transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <a
                          href={child.href}
                          className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground"
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li>
              <SchemeToggle />
            </li>
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      {footerWidgets}
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              © {new Date().getFullYear()} {siteName}
            </span>
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </span>
          <span>
            Powered by{' '}
            <a
              href="https://github.com/danixsofyan/nextpress"
              className="underline underline-offset-4 transition-colors hover:text-foreground"
            >
              NextPress
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
