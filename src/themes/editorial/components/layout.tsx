import { isOptimizableImage } from '@/themes/engine'
import Image from 'next/image'
import Link from 'next/link'
import type { LayoutProps } from '@/themes/engine'

export function Layout({
  children,
  siteName,
  logo,
  navigation = [],
  footerLinks = [],
}: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b-4 border-double border-foreground/80">
        <div className="mx-auto max-w-5xl px-4 pt-8 pb-4 text-center sm:px-6">
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
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">{children}</main>
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
