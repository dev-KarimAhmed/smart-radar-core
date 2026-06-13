import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Radar V5.5',
  description: 'SC55 zero-cost edge architecture migration shell.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0F19',
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
          background: '#0B0F19',
          color: '#F8FAFC',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            background: '#0B0F19',
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
