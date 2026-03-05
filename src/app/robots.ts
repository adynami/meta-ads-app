import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/chat/', '/settings/', '/admin/', '/billing/', '/onboarding/'],
      },
    ],
    sitemap: 'https://adynami.ai/sitemap.xml',
  };
}
