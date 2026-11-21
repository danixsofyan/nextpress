import type { ReactNode } from 'react'
import type { z } from 'zod'

export type PluginCategory = 'analytics' | 'marketing' | 'security'

export type PluginField = {
  key: string
  label: string
  placeholder?: string
  help?: string
}

export type PluginDefinition<Config extends Record<string, string> = Record<string, string>> = {
  id: string
  name: string
  description: string
  category: PluginCategory
  version: string
  config: z.ZodType<Config>
  fields: PluginField[]
  requiredEnv?: string[]
  PublicScripts?: (props: { config: Config }) => ReactNode
}

export const definePlugin = <Config extends Record<string, string>>(
  plugin: PluginDefinition<Config>
) => plugin as unknown as PluginDefinition
