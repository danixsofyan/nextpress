import type { ThemeStyle } from '@/core/validators'
import { themeStyleVars } from '@/themes/engine'
import type { CSSProperties } from 'react'

export function ThemeSwatch({ style, title }: { style: ThemeStyle; title: string }) {
  return (
    <div
      style={themeStyleVars(style) as CSSProperties}
      className="space-y-3 bg-background p-5 text-foreground"
    >
      <div className="flex items-center justify-between border-b border-border pb-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{title}</span>
        <span>Home · Blog · About</span>
      </div>
      <p className="text-lg leading-tight font-bold">The quick brown fox jumps over the lazy dog</p>
      <p className="text-sm text-muted-foreground">
        Body text and muted captions use the theme colors and font.
      </p>
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          Primary button
        </span>
        <span className="rounded-md border border-border bg-accent px-3 py-1.5 text-xs">
          Accent
        </span>
        <span className="text-xs text-primary underline underline-offset-4">Link</span>
      </div>
    </div>
  )
}
