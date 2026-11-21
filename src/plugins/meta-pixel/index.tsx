import Script from 'next/script'
import { z } from 'zod'
import { definePlugin } from '../types'

export const metaPixel = definePlugin({
  id: 'meta-pixel',
  name: 'Meta Pixel',
  description:
    'Track page views for Facebook and Instagram ads. The pixel loads after the page is idle so it never slows the first paint.',
  category: 'marketing',
  version: '1.0.0',
  config: z.object({
    pixelId: z.string().regex(/^\d{10,20}$/, 'The pixel ID is a 10–20 digit number'),
  }),
  fields: [{ key: 'pixelId', label: 'Pixel ID', placeholder: '123456789012345' }],
  PublicScripts: ({ config }) => (
    <Script id="plugin-meta-pixel" strategy="lazyOnload">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${config.pixelId}');fbq('track','PageView');`}
    </Script>
  ),
})
