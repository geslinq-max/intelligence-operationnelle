import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://capital-energie.fr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin/*',
          '/client/',
          '/client/*',
          '/api/',
          '/api/*',
          '/dashboard/',
          '/dashboard/*',
          '/direction/',
          '/direction/*',
          '/gestion/',
          '/gestion/*',
          '/portal/',
          '/portal/*',
          '/profile/',
          '/profile/*',
          '/prospection/',
          '/prospection/*',
          '/verificateur/',
          '/verificateur/*',
          '/espace-client/',
          '/espace-client/*',
          '/partenaire/',
          '/partenaire/*',
          '/login',
          '/403',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
