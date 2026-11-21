import { MenuRepository, PageRepository } from '@/server'
import { defaultScheme, themeSchemeCss, themeShapeVars } from '@/themes/engine'
import type { CSSProperties } from 'react'
import './site.css'
import { AdminBar } from '@/components/admin-bar'
import { FooterWidgets } from '@/components/widget-area'
import { menuToNavigation } from '@/core/validators'
import { db } from '@/lib/db'
import { getActivePlugins } from '@/lib/plugins'
import { getSiteSettings } from '@/lib/site'
import { THEMES, getActiveTheme } from '@/lib/themes'

const SCHEME_SCRIPT = `try{var s=localStorage.getItem('np-scheme');if(s==='light'||s==='dark')document.currentScript.parentElement.dataset.scheme=s}catch(e){}`

const DEFAULT_NAVIGATION = [{ label: 'Blog', href: '/blog' }]

async function getNavigation() {
  const menu = await new MenuRepository(db).findBySlug('primary').catch(() => null)
  if (!menu) return DEFAULT_NAVIGATION
  const links = menuToNavigation(menu.items)
  return links.length > 0 ? links : DEFAULT_NAVIGATION
}

async function getFooterLinks(privacyPageId: string) {
  if (!privacyPageId) return []
  const page = await new PageRepository(db).findById(privacyPageId).catch(() => null)
  return page?.status === 'published' ? [{ label: page.title, href: `/${page.slug}` }] : []
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteSettings()
  const [footerLinks, navigation, active, plugins] = await Promise.all([
    getFooterLinks(site.privacyPage),
    getNavigation(),
    getActiveTheme(),
    getActivePlugins(),
  ])
  const { Layout } = active.theme.slots
  return (
    <>
      <AdminBar {...(active.preview && { previewTheme: THEMES[active.id].label })} />
      <style dangerouslySetInnerHTML={{ __html: themeSchemeCss(active.style, '.np-site') }} />
      {site.customCss && <style dangerouslySetInnerHTML={{ __html: site.customCss }} />}
      <div
        data-scheme={defaultScheme(active.style)}
        suppressHydrationWarning
        style={themeShapeVars(active.style) as CSSProperties}
        className="np-site bg-background text-foreground"
      >
        <script dangerouslySetInnerHTML={{ __html: SCHEME_SCRIPT }} />
        <Layout
          siteName={site.title}
          {...(site.logo && { logo: site.logo })}
          navigation={navigation}
          footerLinks={footerLinks}
          footerWidgets={<FooterWidgets />}
        >
          {children}
        </Layout>
      </div>
      {plugins.map(({ plugin, config }) =>
        plugin.PublicScripts ? <plugin.PublicScripts key={plugin.id} config={config} /> : null
      )}
    </>
  )
}
