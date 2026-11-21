'use client'

import { Button } from '@/components/ui/button'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useConfirm } from './confirm-dialog'
import { useToast } from './toast'

export type Column<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  className?: string
}

export type FilterOption<T> = {
  value: string
  label: string
  match: (row: T) => boolean
}

export type BulkAction<T> = {
  label: string
  run: (rows: T[]) => Promise<void>
  confirm?: (count: number) => string
}

type Props<T> = {
  rows: T[] | null
  rowId: (row: T) => string
  columns: Column<T>[]
  searchText?: (row: T) => string
  searchPlaceholder?: string
  filters?: FilterOption<T>[]
  bulkActions?: BulkAction<T>[]
  rowActions?: (row: T) => ReactNode
  emptyMessage?: string
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
  pageSizes?: number[]
}

const ALL = 'all'
const DEFAULT_PAGE_SIZES = [10, 20, 50, 100]

function readParams() {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

function writeParams(values: Record<string, string>) {
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  window.history.replaceState(null, '', url)
}

export function DataTable<T>({
  rows,
  rowId,
  columns,
  searchText,
  searchPlaceholder = 'Search…',
  filters,
  bulkActions,
  rowActions,
  emptyMessage = 'Nothing found.',
  defaultSort,
  pageSizes = DEFAULT_PAGE_SIZES,
}: Props<T>) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizes[1] ?? 20)
  const [sort, setSort] = useState(defaultSort ?? null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [action, setAction] = useState('')
  const [running, setRunning] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  useEffect(() => {
    const p = readParams()
    setQuery(p.get('q') ?? '')
    setFilter(p.get('filter') ?? ALL)
    setPage(Math.max(1, Number(p.get('page')) || 1))
    const size = Number(p.get('per_page'))
    if (pageSizes.includes(size)) setPageSize(size)
  }, [pageSizes])

  const searched = useMemo(() => {
    if (!rows) return []
    const q = query.trim().toLowerCase()
    if (!q || !searchText) return rows
    return rows.filter((row) => searchText(row).toLowerCase().includes(q))
  }, [rows, query, searchText])

  const counts = useMemo(
    () =>
      Object.fromEntries((filters ?? []).map((f) => [f.value, searched.filter(f.match).length])),
    [filters, searched]
  )

  const filtered = useMemo(() => {
    const active = filters?.find((f) => f.value === filter)
    const list = active ? searched.filter(active.match) : searched
    const column = sort && columns.find((c) => c.key === sort.key)
    if (!column?.sortValue) return list
    const value = column.sortValue
    return [...list].sort((a, b) => {
      const x = value(a)
      const y = value(b)
      const order = x < y ? -1 : x > y ? 1 : 0
      return sort?.dir === 'desc' ? -order : order
    })
  }, [searched, filters, filter, sort, columns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)
  const visibleIds = visible.map(rowId)
  const filteredIds = filtered.map(rowId)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const someVisibleSelected = visibleIds.some((id) => selected.has(id))
  const selectedRows = (rows ?? []).filter((row) => selected.has(rowId(row)))

  function update(next: { q?: string; filter?: string; page?: number; perPage?: number }) {
    if (next.q !== undefined) setQuery(next.q)
    if (next.filter !== undefined) setFilter(next.filter)
    if (next.page !== undefined) setPage(next.page)
    if (next.perPage !== undefined) setPageSize(next.perPage)
    if (next.q !== undefined || next.filter !== undefined) setSelected(new Set())
    writeParams({
      ...(next.q !== undefined && { q: next.q }),
      ...(next.filter !== undefined && { filter: next.filter === ALL ? '' : next.filter }),
      ...(next.page !== undefined && { page: next.page > 1 ? String(next.page) : '' }),
      ...(next.perPage !== undefined && { per_page: String(next.perPage) }),
    })
  }

  function toggleSort(column: Column<T>) {
    if (!column.sortValue) return
    setSort((prev) =>
      prev?.key === column.key
        ? { key: column.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: column.key, dir: 'asc' }
    )
  }

  function toggleVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of visibleIds) {
        if (allVisibleSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function applyBulk() {
    const bulk = bulkActions?.find((b) => b.label === action)
    if (!bulk || selectedRows.length === 0) return
    if (
      bulk.confirm &&
      !(await confirm({
        title: bulk.confirm(selectedRows.length),
        destructive: true,
        confirmLabel: bulk.label,
      }))
    )
      return
    setRunning(true)
    const count = selectedRows.length
    const ok = await toast.run(
      () => bulk.run(selectedRows),
      `${bulk.label}: ${count} item${count === 1 ? '' : 's'} done.`
    )
    setRunning(false)
    if (ok) {
      setSelected(new Set())
      setAction('')
    }
  }

  const hasBulk = Boolean(bulkActions?.length)
  const sortableColumns = columns.filter((c) => c.sortValue)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchText && (
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => update({ q: e.target.value, page: 1 })}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 w-full rounded-md border border-input bg-background py-2 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
        {filters && filters.length > 0 && (
          <select
            aria-label="Filter"
            value={filter}
            onChange={(e) => update({ filter: e.target.value, page: 1 })}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value={ALL}>All ({searched.length})</option>
            {filters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label} ({counts[f.value] ?? 0})
              </option>
            ))}
          </select>
        )}
        {sortableColumns.length > 0 && (
          <div className="flex items-center">
            <select
              aria-label="Sort by"
              value={sort?.key ?? ''}
              onChange={(e) => setSort({ key: e.target.value, dir: sort?.dir ?? 'asc' })}
              className="h-9 rounded-md rounded-r-none border border-input bg-background px-2 text-sm"
            >
              <option value="" disabled>
                Sort by
              </option>
              {sortableColumns.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.header}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!sort}
              onClick={() =>
                sort && setSort({ key: sort.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
              }
              aria-label={sort?.dir === 'desc' ? 'Sort ascending' : 'Sort descending'}
              className="inline-flex h-9 items-center rounded-md rounded-l-none border border-l-0 border-input px-2 hover:bg-muted/40 disabled:opacity-50"
            >
              {!sort ? (
                <ArrowUpDown className="size-4" />
              ) : sort.dir === 'asc' ? (
                <ArrowUp className="size-4" />
              ) : (
                <ArrowDown className="size-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {hasBulk && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Bulk actions"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Bulk actions</option>
            {bulkActions?.map((b) => (
              <option key={b.label} value={b.label}>
                {b.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!action || selectedRows.length === 0 || running}
            onClick={applyBulk}
          >
            {running ? 'Applying…' : 'Apply'}
          </Button>
          {selectedRows.length > 0 && (
            <span className="text-sm text-muted-foreground">{selectedRows.length} selected</span>
          )}
        </div>
      )}

      {hasBulk && allVisibleSelected && filteredIds.length > visibleIds.length && (
        <div className="rounded-md bg-muted px-3 py-2 text-center text-sm">
          {filteredIds.every((id) => selected.has(id)) ? (
            <>
              All {filteredIds.length} items are selected.{' '}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => setSelected(new Set())}
              >
                Clear selection
              </button>
            </>
          ) : (
            <>
              All {visibleIds.length} items on this page are selected.{' '}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => setSelected(new Set(filteredIds))}
              >
                Select all {filteredIds.length} items
              </button>
            </>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left">
            <tr>
              {hasBulk && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected
                    }}
                    onChange={toggleVisible}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-medium text-muted-foreground ${column.className ?? ''}`}
                  aria-sort={
                    sort?.key === column.key
                      ? sort.dir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {column.header}
                      {sort?.key === column.key &&
                        (sort.dir === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        ))}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {rowActions && (
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {query || filter !== ALL ? 'No items match your search.' : emptyMessage}
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const id = rowId(row)
                return (
                  <tr
                    key={id}
                    className={`border-b border-border last:border-0 hover:bg-muted/30 ${selected.has(id) ? 'bg-muted/40' : ''}`}
                  >
                    {hasBulk && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={selected.has(id)}
                          onChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>
                        {column.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">{rowActions(row)}</div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {rows !== null && filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="tabular-nums">
              Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
              {filtered.length !== (rows?.length ?? 0)
                ? ` (filtered from ${rows?.length ?? 0})`
                : ''}
            </span>
            <label className="flex items-center gap-1">
              <span className="hidden sm:inline">Rows</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => update({ perPage: Number(e.target.value), page: 1 })}
                className="h-8 rounded-md border border-input bg-background px-1.5 text-sm"
              >
                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {totalPages > 1 && (
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => update({ page: currentPage - 1 })}
                aria-label="Previous page"
                className="inline-flex size-8 items-center justify-center rounded-md border border-input hover:bg-muted/40 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              {pageNumbers.map((n, i) => (
                <span key={n} className="flex items-center gap-1">
                  {i > 0 && n - (pageNumbers[i - 1] ?? n) > 1 && <span className="px-1">…</span>}
                  <button
                    type="button"
                    aria-current={n === currentPage ? 'page' : undefined}
                    onClick={() => update({ page: n })}
                    className={`inline-flex size-8 items-center justify-center rounded-md border text-sm tabular-nums ${
                      n === currentPage
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input hover:bg-muted/40'
                    }`}
                  >
                    {n}
                  </button>
                </span>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => update({ page: currentPage + 1 })}
                aria-label="Next page"
                className="inline-flex size-8 items-center justify-center rounded-md border border-input hover:bg-muted/40 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
