import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://capital-energie.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  return [
    // Page d'accueil
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Page d'inscription
    {
      url: `${BASE_URL}/inscription`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Page tarifs
    {
      url: `${BASE_URL}/tarifs`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // =========================================================================
    // PAGES MÉTIERS - CEE (Artisans RGE)
    // =========================================================================
    {
      url: `${BASE_URL}/entreprises`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // =========================================================================
    // PAGES MÉTIERS - PAYSAGISTE
    // =========================================================================
    {
      url: `${BASE_URL}/paysagiste`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/paysagiste/bsd`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // =========================================================================
    // PAGES MÉTIERS - VITICULTEUR
    // =========================================================================
    {
      url: `${BASE_URL}/viticulture`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/viticulture/registre-phyto`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // =========================================================================
    // PAGES LÉGALES
    // =========================================================================
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/confidentialite`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cgv`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
