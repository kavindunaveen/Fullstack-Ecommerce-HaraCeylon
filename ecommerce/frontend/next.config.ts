import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    remotePatterns: [
      // Allow images from the live Hostinger backend
      { protocol: 'https', hostname: 'api.haraceylon.com', pathname: '/uploads/**' },
      // Allow images from local dev backend
      { protocol: 'http', hostname: 'localhost', port: '8001', pathname: '/uploads/**' },
    ],
    // Serve WebP format automatically for 20-30% smaller files
    formats: ['image/webp', 'image/avif'],
  },
  eslint: {
    // Allow production builds even with ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds even with minor TS errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
