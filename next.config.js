import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
  {
    protocol: 'https',
    hostname: 'plus.unsplash.com',
  },
  {
    protocol: 'https',
    hostname: 'via.placeholder.com',
  },
  {
    protocol: 'https',
    hostname: '*.supabase.co',
  },
];

const supabaseUrlRaw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
if (supabaseUrlRaw) {
  try {
    const parsedSupabase = new URL(supabaseUrlRaw);
    const proto = parsedSupabase.protocol.replace(':', '');
    if ((proto === 'https' || proto === 'http') && parsedSupabase.hostname && !parsedSupabase.hostname.endsWith('.supabase.co')) {
      remotePatterns.push({
        protocol: proto,
        hostname: parsedSupabase.hostname,
      });
    }
  } catch {
    // Ignore malformed NEXT_PUBLIC_SUPABASE_URL during config load
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty default config to silence Next.js configuration errors under Turbopack
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns,
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)',
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
