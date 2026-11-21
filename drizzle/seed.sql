INSERT INTO taxonomies (name, slug, type, description) VALUES
  ('Uncategorized', 'uncategorized', 'category', 'Posts without a more specific category'),
  ('Announcements', 'announcements', 'category', 'Releases, changes, and project news'),
  ('Tutorials', 'tutorials', 'category', 'Step-by-step walkthroughs'),
  ('Guides', 'guides', 'category', 'In-depth explanations and best practices'),
  ('Case Studies', 'case-studies', 'category', 'Real projects built with NextPress'),
  ('ai', 'ai', 'tag', NULL),
  ('mcp', 'mcp', 'tag', NULL),
  ('seo', 'seo', 'tag', NULL),
  ('nextjs', 'nextjs', 'tag', NULL),
  ('wordpress', 'wordpress', 'tag', NULL),
  ('landing-page', 'landing-page', 'tag', NULL),
  ('open-source', 'open-source', 'tag', NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO settings (key, value) VALUES
  ('posts_per_page', '10'),
  ('default_category', 'uncategorized')
ON CONFLICT (key) DO NOTHING;
