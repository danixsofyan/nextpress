import { googleAnalytics } from './google-analytics'
import { metaPixel } from './meta-pixel'
import type { PluginDefinition } from './types'

export const PLUGINS: PluginDefinition[] = [googleAnalytics, metaPixel]

export const findPlugin = (id: string) => PLUGINS.find((p) => p.id === id)

export type { PluginDefinition, PluginField } from './types'
