import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://penpad.io'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep all authenticated app routes and API private
        disallow: ['/dashboard', '/reports', '/settings', '/templates', '/api/', '/admin'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
