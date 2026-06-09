import './globals.css';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'الرادار الذكي - الكابتن',
  description: 'منصة الرادار الذكي للكباتن',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'رادار الكابتن',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-touch-fullscreen': 'yes',
  }
};

export const viewport: Viewport = {
  themeColor: '#091B09',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head />
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
