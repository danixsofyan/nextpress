import Script from 'next/script'
import { z } from 'zod'
import { definePlugin } from '../types'

export const googleAnalytics = definePlugin({
  id: 'google-analytics',
  name: 'Google Analytics 4',
  description:
    'Measure visits and conversions with Google Analytics 4. Loaded on the public site only.',
  category: 'analytics',
  version: '1.0.0',
  config: z.object({
    measurementId: z.string().regex(/^G-[A-Z0-9]{4,20}$/, 'Use a measurement ID like G-XXXXXXXXXX'),
  }),
  fields: [{ key: 'measurementId', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' }],
  PublicScripts: ({ config }) => (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="plugin-google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${config.measurementId}")`}
      </Script>
    </>
  ),
})
