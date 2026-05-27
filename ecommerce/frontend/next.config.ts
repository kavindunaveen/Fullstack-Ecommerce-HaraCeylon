import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,

  // ── Unique build ID ───────────────────────────────────────────────────────
  // Each deployment gets a unique ID based on the current timestamp.
  // This ensures the browser always knows this is a "new" build and requests
  // fresh HTML, even if Hostinger served a cached copy.
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // ── HTTP Cache-Control headers via Node.js ────────────────────────────────
  // These headers are sent by the Next.js Node.js server.
  // Combined with .htaccess rules, this double-protects against stale caches.
  async headers() {
    return [
      {
        // HTML pages — NEVER cache. The filename of CSS/JS changes every build,
        // so stale HTML = broken styles. Force browsers to always fetch fresh HTML.
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          // Service-worker safe: tell SW not to cache HTML
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      },
      {
        // Next.js static assets (CSS, JS, fonts) — cache forever.
        // They have content-hashed filenames: styles.a1b2c3.css
        // When content changes, filename changes → browser fetches new file.
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      // Allow images from the live Hostinger backend
      { protocol: 'https', hostname: 'api.haraceylon.com', pathname: '/**' },
      // Allow images from local dev backend
      { protocol: 'http', hostname: 'localhost', port: '8001', pathname: '/**' },
    ],
    // Serve WebP format automatically for 20-30% smaller files
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
