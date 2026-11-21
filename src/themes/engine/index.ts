import type { Page, Post, Taxonomy } from '@/core/types'
import type { Block, ThemeStyle } from '@/core/validators'
import type { ComponentType } from 'react'

export interface LayoutProps {
  children: React.ReactNode
  siteName: string
  logo?: string
  navigation?: Array<{ label: string; href: string }>
  footerLinks?: Array<{ label: string; href: string }>
}

export interface HeaderProps {
  siteName: string
  navigation?: Array<{ label: string; href: string }>
}

export interface FooterProps {
  siteName: string
  links?: Array<{ label: string; href: string }>
}

export interface PostCardProps {
  post: Post
  timeZone?: string
  dateFormat?: string
}

export interface PostListProps {
  posts: Post[]
  timeZone?: string
  dateFormat?: string
}

export interface PostDetailProps {
  post: Post
  timeZone?: string
  dateFormat?: string
  relatedPosts?: Post[]
}

export interface CategoryPageProps {
  taxonomy: Taxonomy
  posts: Post[]
}

export interface TagPageProps {
  taxonomy: Taxonomy
  posts: Post[]
}

export interface HomePageProps {
  posts: Post[]
  pages: Page[]
  featuredPost?: Post
}

export interface BlocksProps {
  blocks: Block[]
  posts?: Post[]
  timeZone?: string
  dateFormat?: string
}

export type { Block }

export type { ThemeStyle }

export interface ThemeConfig {
  name: string
  label: string
  description: string
  version: string
  defaultStyle: ThemeStyle
  supports: Array<'blog' | 'landing' | 'store'>
  slots: {
    Layout: ComponentType<LayoutProps>
    Header: ComponentType<HeaderProps>
    Footer: ComponentType<FooterProps>
    PostCard: ComponentType<PostCardProps>
    PostList: ComponentType<PostListProps>
    PostDetail: ComponentType<PostDetailProps>
    CategoryPage: ComponentType<CategoryPageProps>
    TagPage: ComponentType<TagPageProps>
    HomePage: ComponentType<HomePageProps>
    Blocks: ComponentType<BlocksProps>
  }
}

export function defineTheme(config: ThemeConfig): ThemeConfig {
  return config
}

export { formatDate, isValidTimeZone } from './format-date'
export { themeStyleVars } from './style'

export const isOptimizableImage = (src: string) => src.startsWith('/') && !/\.svg($|\?)/i.test(src)
