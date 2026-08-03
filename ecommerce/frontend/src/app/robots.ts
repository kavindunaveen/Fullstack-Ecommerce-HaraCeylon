import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/admin/'],
    },
    sitemap: 'https://haraceylon.com/sitemap.xml',
  };
}
