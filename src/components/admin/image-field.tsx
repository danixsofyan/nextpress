'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Images, Loader2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { MediaPicker } from './media-picker'
import { useToast } from './toast'

type Props = {
  id: string
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  previewClassName?: string
}

export function ImageField({ id, label, hint, value, onChange, previewClassName }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const toast = useToast()

  async function upload(file: File) {
    setUploading(true)
    setError('')
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/admin/media', { method: 'POST', body: form })
    setUploading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message = body.error ?? 'Upload failed. Is media storage configured?'
      setError(message)
      toast.error(message)
      return
    }
    onChange((await res.json()).url)
    toast.success(`${label} uploaded. Save to apply it.`)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-start gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted ${previewClassName ?? 'size-16'}`}
        >
          {value ? (
            <Image
              src={value}
              alt=""
              width={128}
              height={128}
              unoptimized
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-[10px] text-muted-foreground">None</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Input
              className="min-w-0"
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://… or /path"
            />
            <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
              <Images className="size-4" />
              Media Library
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
            {value && (
              <Button type="button" variant="ghost" onClick={() => onChange('')}>
                <X className="size-4" />
                <span className="sr-only">Remove {label}</span>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={`Choose ${label}`}
        onSelect={(url) => {
          onChange(url)
          toast.success(`${label} selected. Save to apply it.`)
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
