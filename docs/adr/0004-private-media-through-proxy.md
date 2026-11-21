# ADR-0004: Keep the media bucket private and serve files through the app

- **Status:** accepted
- **Date:** 2026-11-21

## Context

Uploads go to S3-compatible storage (Supabase Storage in production). A public bucket exposes every object and ties media URLs to the storage vendor.

## Decision

The bucket stays private. Files are stored as `<uuid>.<ext>`, where the extension comes from the type detected by magic bytes. They are served from `/media/<uuid>.<ext>` by a route that streams the object with `Cache-Control: public, max-age=31536000, immutable`. Setting `S3_PUBLIC_URL` switches to direct public URLs for those who want that.

## Consequences

- Media URLs live on the site's own domain, which is good for SEO, and are cached by the CDN.
- The storage vendor can change without breaking URLs.
- The first request for each object goes through a function invocation.
