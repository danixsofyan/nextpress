'use client'

import { Button } from '@/components/ui/button'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void }

type Confirm = (options: ConfirmOptions | string) => Promise<boolean>

const ConfirmContext = createContext<Confirm | null>(null)

function toOptions(options: ConfirmOptions | string): ConfirmOptions {
  if (typeof options !== 'string') return options
  const i = options.indexOf('? ')
  return i === -1
    ? { title: options, destructive: true }
    : { title: options.slice(0, i + 1), description: options.slice(i + 2), destructive: true }
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback<Confirm>(
    (options) => new Promise<boolean>((resolve) => setPending({ ...toOptions(options), resolve })),
    []
  )

  useEffect(() => {
    if (pending && !dialogRef.current?.open) dialogRef.current?.showModal()
  }, [pending])

  function close(ok: boolean) {
    pending?.resolve(ok)
    setPending(null)
    if (dialogRef.current?.open) dialogRef.current.close()
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        onCancel={(e) => {
          e.preventDefault()
          close(false)
        }}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-border bg-background p-6 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {pending && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 id="confirm-title" className="text-lg font-semibold">
                {pending.title}
              </h2>
              {pending.description && (
                <p id="confirm-description" className="text-sm text-muted-foreground">
                  {pending.description}
                </p>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button
                variant={pending.destructive ? 'destructive' : 'default'}
                onClick={() => close(true)}
              >
                {pending.confirmLabel ?? (pending.destructive ? 'Delete' : 'Continue')}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider')
  return ctx
}
