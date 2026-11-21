'use client'

import { Play } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export function VideoEmbed({
  src,
  autoplaySrc,
  thumbnail,
  title,
}: {
  src: string
  autoplaySrc: string
  thumbnail: string | null
  title: string
}) {
  const [playing, setPlaying] = useState(false)
  if (playing) {
    return (
      <iframe
        src={autoplaySrc}
        title={title}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="aspect-video w-full rounded-2xl border-0"
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${title}`}
      data-src={src}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border bg-neutral-900"
    >
      {thumbnail && (
        <Image
          src={thumbnail}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
        />
      )}
      <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-black/70 text-white shadow-xl transition-transform group-hover:scale-110">
        <Play className="size-7 translate-x-0.5 fill-current" aria-hidden />
      </span>
    </button>
  )
}
