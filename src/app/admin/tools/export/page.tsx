'use client'

import { Download } from 'lucide-react'
import { useState } from 'react'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { Button } from '@/components/ui/button'

const OPTIONS = [
  { value: 'all', label: 'All content', help: 'Posts, pages, categories, and tags.' },
  { value: 'posts', label: 'Posts', help: 'Posts with their categories and tags.' },
  { value: 'pages', label: 'Pages', help: 'Pages only.' },
] as const

export default function ExportPage() {
  const [content, setContent] = useState<(typeof OPTIONS)[number]['value']>('all')
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-sm text-muted-foreground">
          Download a WordPress export file (WXR). Import it into another NextPress site under Tools
          → Import, or into WordPress under Tools → Import → WordPress.
        </p>
      </div>
      <fieldset className="max-w-xl space-y-3 rounded-lg border p-5">
        <legend className="px-1 text-sm font-semibold">Choose what to export</legend>
        {OPTIONS.map((option) => (
          <label key={option.value} className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="content"
              value={option.value}
              checked={content === option.value}
              onChange={() => setContent(option.value)}
              className="mt-1"
            />
            <span>
              <span className="font-medium">{option.label}</span>
              <span className="block text-muted-foreground">{option.help}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <Button asChild>
        <a href={`/api/admin/export?content=${content}`} download>
          <Download className="size-4" /> Download Export File
        </a>
      </Button>
    </DashboardLayout>
  )
}
