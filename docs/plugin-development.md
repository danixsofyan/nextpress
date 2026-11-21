# Plugin development

Plugins add integrations to a NextPress site. They ship as code (see [ADR 0009](adr/0009-plugins-ship-as-code.md)) and administrators activate and configure them under **Plugins** in the admin.

## Create a plugin

1. Create `src/plugins/<id>/index.tsx`:

   ```tsx
   import Script from 'next/script'
   import { z } from 'zod'
   import { definePlugin } from '../types'

   export const myPlugin = definePlugin({
     id: 'my-plugin',
     name: 'My plugin',
     description: 'One sentence shown in the plugin list.',
     category: 'analytics',
     version: '1.0.0',
     config: z.object({ siteId: z.string().regex(/^[a-z0-9]{6,32}$/) }),
     fields: [{ key: 'siteId', label: 'Site ID', placeholder: 'abc123' }],
     PublicScripts: ({ config }) => (
       <Script src={`https://example.com/script.js?id=${config.siteId}`} strategy="lazyOnload" />
     ),
   })
   ```

2. Register it in `src/plugins/index.ts`.
3. Allow its hosts in the CSP in `next.config.ts`.
4. If it needs a secret, add the variable to `src/lib/env.ts` and `.env.example`, and list its name in `requiredEnv`.
5. Add a test next to the plugin that checks its config schema rejects unsafe values.

## Captcha plugins

A plugin with `captcha: 'turnstile'` or `captcha: 'recaptcha'` protects the admin sign-in and the donation form. Only one captcha plugin can be active. The widget renders through `components/captcha-widget.tsx` (lazily on public forms, so it never affects the first paint), and `verifyCaptcha()` in `src/lib/captcha.ts` checks the token on the server with the secret from the environment.

## Rules

- Validate every setting with a strict schema. Values end up inside scripts, so allow only the characters an ID can contain.
- Load third-party scripts with `strategy="lazyOnload"` or `afterInteractive`, never in a way that blocks the first paint.
- Render nothing in the admin. `PublicScripts` runs only on the public site.
