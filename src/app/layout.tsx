import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';
import { BRAND } from '@/lib/brand-tokens';

export const metadata: Metadata = {
  title: 'رادار - مشاركة الرحلات حياً',
  description: 'تطبيق التوصيل ومشاركة الرحلات الذكي بنظام المزايدة الحية',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Radar',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND.bg,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          minHeight: '100vh',
          width: '100%',
          overflowX: 'hidden',
          background: 'var(--color-radar-bg)',
          color: 'var(--color-radar-text-bright)',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            background: 'var(--color-radar-bg)',
          }}
        >
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
