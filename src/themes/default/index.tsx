import Link from 'next/link'
import { defineTheme } from '@/themes/engine'
import { Blocks } from './components/blocks'
import { Layout } from './components/layout'
import { PostCard } from './components/post-card'
import { PostDetail } from './components/post-detail'
import { PostList } from './components/post-list'

export const theme = defineTheme({
  name: 'default',
  label: 'Default',
  description:
    'Clean, modern sans-serif theme with card-based post lists. A good starting point for blogs and product sites.',
  version: '1.0.0',
  defaultStyle: {
    primary: '#0f172a',
    background: '#ffffff',
    foreground: '#0f172a',
    accent: '#f1f5f9',
    font: 'sans',
    radius: 'medium',
  },
  supports: ['blog'],
  slots: {
    Layout,
    Header: ({ siteName }) => (
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/" className="font-bold">
            {siteName}
          </Link>
        </div>
      </header>
    ),
    Footer: ({ siteName }) => (
      <footer className="mt-8 border-t">
        <div className="mx-auto max-w-4xl px-4 py-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteName}
        </div>
      </footer>
    ),
    PostCard,
    PostList,
    PostDetail,
    Blocks,
    CategoryPage: ({ taxonomy, posts }) => (
      <div>
        <h1 className="mb-6 text-2xl font-bold">{taxonomy.name}</h1>
        <div className="grid gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    ),
    TagPage: ({ taxonomy, posts }) => (
      <div>
        <h1 className="mb-6 text-2xl font-bold">#{taxonomy.name}</h1>
        <div className="grid gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    ),
    HomePage: ({ posts }) => (
      <div>
        <h1 className="mb-8 text-3xl font-bold">Latest</h1>
        <div className="grid gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    ),
  },
})

export default theme
export { Layout } from './components/layout'
export { PostCard } from './components/post-card'
export { PostList } from './components/post-list'
export { PostDetail } from './components/post-detail'
export { Blocks } from './components/blocks'
