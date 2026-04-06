import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket (*.r2.dev) and custom R2 domains
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      // Allow any HTTPS source in development / staging for seed/placeholder images
      ...(process.env.NODE_ENV !== 'production'
        ? [{ protocol: 'https' as const, hostname: '**' }]
        : []),
    ],
  },
};

export default withNextIntl(nextConfig);
