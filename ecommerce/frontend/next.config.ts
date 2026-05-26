import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
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
