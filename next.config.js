import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty default config to silence Next.js configuration errors under Turbopack
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
