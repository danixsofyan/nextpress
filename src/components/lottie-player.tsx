'use client'

import { useEffect, useRef } from 'react'

export function LottiePlayer({
  src,
  label,
  loop = true,
}: {
  src: string
  label: string
  loop?: boolean | undefined
}) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = container.current
    if (!element) return
    let animation: { destroy: () => void; play: () => void; pause: () => void } | undefined
    let cancelled = false
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    async function start() {
      const [{ default: lottie }, data] = await Promise.all([
        import('lottie-web/build/player/lottie_light'),
        fetch(src).then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText)))),
      ])
      if (cancelled || !element) return
      const instance = lottie.loadAnimation({
        container: element,
        renderer: 'svg',
        loop,
        autoplay: !still,
        animationData: data,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
      })
      if (still) instance.goToAndStop(0, true)
      animation = instance
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting && !animation) {
          start().catch(() => element.setAttribute('data-failed', ''))
        }
        if (animation && !still) {
          if (entry.isIntersecting) animation.play()
          else animation.pause()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(element)
    return () => {
      cancelled = true
      observer.disconnect()
      animation?.destroy()
    }
  }, [src, loop])

  return <div ref={container} role="img" aria-label={label} className="aspect-video w-full" />
}
