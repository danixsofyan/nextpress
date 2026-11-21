import type { NextConfig } from 'next'

const dev = process.env.NODE_ENV !== 'production'

function csp(extra: { script?: string; style?: string } = {}) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}${extra.script ? ` ${extra.script}` : ''} https://www.googletagmanager.com`,
    `style-src 'self' 'unsafe-inline'${extra.style ? ` ${extra.style}` : ''}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'] },
  outputFileTracingIncludes: {
    '/docs/[slug]': ['./docs/*.md'],
  },
  async rewrites() {
    return [{ source: '/blog/:slug([a-z0-9-]+).md', destination: '/blog/:slug/md' }]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp() },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/docs',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp({ script: 'https://cdn.jsdelivr.net', style: 'https://cdn.jsdelivr.net' }),
          },
        ],
      },
    ]
  },
}

export default nextConfig
