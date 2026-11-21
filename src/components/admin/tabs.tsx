'use client'

type Tab<K extends string> = { key: K; label: string }

type Props<K extends string> = {
  tabs: readonly Tab<K>[]
  value: K
  onChange: (key: K) => void
  label?: string
}

export function Tabs<K extends string>({ tabs, value, onChange, label = 'Sections' }: Props<K>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-1 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-1 pb-px"
    >
      {tabs.map((t) => {
        const active = t.key === value
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
