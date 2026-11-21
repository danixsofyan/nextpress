import { SettingsRepository } from '@/server'
import { PLUGINS, type PluginDefinition, findPlugin } from '@/plugins'
import { cache } from 'react'
import { z } from 'zod'
import { db } from './db'
import { env } from './env'

export const PLUGINS_SETTING = 'plugins'

const storedSchema = z.record(
  z.string(),
  z.object({ active: z.boolean(), config: z.record(z.string(), z.string()) })
)

export type StoredPlugins = z.infer<typeof storedSchema>

export function parseStoredPlugins(raw: string | undefined, legacyGaId?: string): StoredPlugins {
  if (raw) {
    try {
      const parsed = storedSchema.safeParse(JSON.parse(raw))
      if (parsed.success) return parsed.data
    } catch {
      return {}
    }
  }
  return legacyGaId && /^G-[A-Z0-9]+$/.test(legacyGaId)
    ? { 'google-analytics': { active: true, config: { measurementId: legacyGaId } } }
    : {}
}

const missingEnv = (names: string[] = []) =>
  names.filter((name) => !(env as Record<string, unknown>)[name])

export const getPluginStates = cache(async () => {
  const s = await new SettingsRepository(db).getAll()
  const stored = parseStoredPlugins(s[PLUGINS_SETTING], s.ga_id)
  return PLUGINS.map((plugin) => {
    const entry = stored[plugin.id]
    const config = plugin.config.safeParse(entry?.config ?? {})
    const missing = missingEnv(plugin.requiredEnv)
    return {
      plugin,
      config: entry?.config ?? {},
      active: Boolean(entry?.active) && config.success && missing.length === 0,
      configured: config.success,
      missingEnv: missing,
    }
  })
})

export async function getActivePlugins() {
  return (await getPluginStates()).filter((s) => s.active)
}

type SaveResult = { ok: true } | { error: string; status: number }

export async function savePlugin(
  id: string,
  update: { active?: boolean; config?: unknown }
): Promise<SaveResult> {
  const plugin = findPlugin(id)
  if (!plugin) return { error: 'Plugin not found', status: 404 }
  const repo = new SettingsRepository(db)
  const all = await repo.getAll()
  const stored = parseStoredPlugins(all[PLUGINS_SETTING], all.ga_id)
  const current = stored[id] ?? { active: false, config: {} }
  let nextConfig = current.config
  if (update.config !== undefined) {
    const parsed = plugin.config.safeParse(update.config)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid settings', status: 400 }
    }
    nextConfig = parsed.data
  }
  const active = update.active ?? current.active
  if (active && !plugin.config.safeParse(nextConfig).success) {
    return { error: 'Fill in the plugin settings before activating it', status: 400 }
  }
  const missing = missingEnv(plugin.requiredEnv)
  if (active && missing.length > 0) {
    return { error: `Set ${missing.join(', ')} in the environment first`, status: 400 }
  }
  const otherCaptcha =
    active &&
    plugin.captcha &&
    PLUGINS.find((p) => p.id !== id && p.captcha && stored[p.id]?.active)
  if (otherCaptcha) {
    return { error: `Deactivate ${otherCaptcha.name} first`, status: 409 }
  }
  stored[id] = { active, config: nextConfig }
  await repo.set(PLUGINS_SETTING, JSON.stringify(stored))
  return { ok: true }
}

export type CaptchaConfig = { provider: NonNullable<PluginDefinition['captcha']>; siteKey: string }

export async function getCaptcha(): Promise<CaptchaConfig | null> {
  const active = (await getActivePlugins()).find((s) => s.plugin.captcha)
  return active?.plugin.captcha && active.config.siteKey
    ? { provider: active.plugin.captcha, siteKey: active.config.siteKey }
    : null
}
