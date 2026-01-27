import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://algoedgehub.com';
  const currentDate = new Date().toISOString();

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/verify-otp`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Blog pages - SEO optimized content
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog/best-xauusd-strategy-2026`,
      lastModified: '2026-01-15T00:00:00Z',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/how-to-automate-mt5-trading`,
      lastModified: '2026-01-12T00:00:00Z',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/best-forex-bots-for-beginners`,
      lastModified: '2026-01-10T00:00:00Z',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/best-trading-api-2026`,
      lastModified: '2026-01-25T00:00:00Z',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/best-forex-signals-2026`,
      lastModified: '2026-01-25T00:00:00Z',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/forex-trading-courses-2026`,
      lastModified: '2026-01-25T00:00:00Z',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/risk-management-rules-every-trader`,
      lastModified: '2026-01-18T00:00:00Z',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/trading-psychology-overcoming-fear-greed`,
      lastModified: '2026-01-20T00:00:00Z',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
