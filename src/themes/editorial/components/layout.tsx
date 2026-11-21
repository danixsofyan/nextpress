import { isOptimizableImage } from '@/themes/engine'
import Image from 'next/image'
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
      <header className="border-b-4 border-double border-foreground/80">
        <div className="relative mx-auto max-w-5xl px-4 pt-8 pb-4 text-center sm:px-6">
          <div className="absolute top-3 right-4 sm:right-6">
            <SchemeToggle />
          </div>
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            {logo ? (
              <Image
                src={logo}
                alt={siteName}
                width={260}
                height={48}
                priority
                unoptimized={!isOptimizableImage(logo)}
                className="mx-auto h-12 w-auto max-w-[260px] object-contain"
              />
            ) : (
              <span className="text-4xl font-bold tracking-tight sm:text-5xl">{siteName}</span>
            )}
          </Link>
        </div>
        {navigation.length > 0 && (
          <nav className="border-t border-border">
            <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-6 gap-y-1 px-4 py-3 text-sm tracking-widest uppercase sm:px-6">
              {navigation.map((item) => (
                <li key={item.href} className="group relative">
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                    {...(item.children && { 'aria-haspopup': 'true' as const })}
                  >
                    <LinkLabel href={item.href} label={item.label} />
                    <GithubStars
                      href={item.href}
                      className="bg-foreground/10 tracking-normal text-foreground"
                    />
                  </a>
                  {item.children && (
                    <ul className="invisible absolute top-full left-1/2 z-50 min-w-48 -translate-x-1/2 border border-border bg-background py-2 text-left tracking-normal normal-case opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <a
                            href={child.href}
                            className="block px-4 py-2 text-muted-foreground hover:text-primary focus-visible:text-primary"
                          >
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">{children}</main>
      {footerWidgets}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
          {footerLinks.length > 0 && (
            <p className="flex flex-wrap justify-center gap-x-4">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </p>
          )}
          <p>
            © {new Date().getFullYear()} {siteName} · Powered by{' '}
            <a
              href="https://github.com/danixsofyan/nextpress"
              className="underline underline-offset-4 transition-colors hover:text-foreground"
            >
              NextPress
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
