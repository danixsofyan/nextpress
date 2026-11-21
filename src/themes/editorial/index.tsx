import Link from 'next/link'
import { Blocks } from '@/themes/default'
import { defineTheme } from '@/themes/engine'
import { Layout } from './components/layout'
import { PostCard } from './components/post-card'
import { PostDetail } from './components/post-detail'
import { PostList } from './components/post-list'

export const theme = defineTheme({
  name: 'editorial',
  label: 'Editorial',
  description:
    "Magazine-style theme with a centered serif masthead, story lists, and drop caps. Reuses the Default theme's blocks, like a WordPress child theme.",
  version: '1.0.0',
  defaultStyle: {
    primary: '#9f1239',
    background: '#fffdf8',
    foreground: '#1c1917',
    accent: '#f5efe3',
    font: 'serif',
    radius: 'small',
  },
  supports: ['blog', 'landing'],
  slots: {
    Layout,
    Header: ({ siteName }) => (
      <header className="border-b-4 border-double py-6 text-center">
        <Link href="/" className="text-4xl font-bold">
          {siteName}
        </Link>
      </header>
    ),
    Footer: ({ siteName }) => (
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteName}
      </footer>
    ),
    PostCard,
    PostList,
    PostDetail,
    Blocks,
    CategoryPage: ({ taxonomy, posts }) => (
      <div className="space-y-8">
        <h1 className="text-center text-4xl font-bold">{taxonomy.name}</h1>
        <PostList posts={posts} />
      </div>
    ),
    TagPage: ({ taxonomy, posts }) => (
      <div className="space-y-8">
        <h1 className="text-center text-4xl font-bold">#{taxonomy.name}</h1>
        <PostList posts={posts} />
      </div>
    ),
    HomePage: ({ posts }) => <PostList posts={posts} />,
  },
})

export default theme
export { Layout, PostCard, PostDetail, PostList }
