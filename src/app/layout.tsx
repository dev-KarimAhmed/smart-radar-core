import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono, Almarai } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const almarai = Almarai({
  variable: '--font-almarai',
  subsets: ['arabic'],
  weight: ['300', '400', '700', '800'],
});

const styles = {
  root: "",
} as const;


export const metadata: Metadata = {
  title: 'رادار - مشاركة الرحلات حياً',
  description: 'تطبيق التوصيل ومشاركة الرحلات الذكي بنظام المزايدة الحية',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Radar',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0F1D',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${almarai.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          minHeight: '100vh',
          width: '100%',
          overflowX: 'hidden',
          background: '#0A0F1D',
          color: '#F8FAFC',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            background: '#0A0F1D',
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
