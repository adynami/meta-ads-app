import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: {
    default: 'Adynami - Conversational AI for Meta Advertising',
    template: '%s | Adynami',
  },
  description:
    'Control your Meta ads through conversation. Launch campaigns, diagnose performance, build audiences — no dashboards required.',
  metadataBase: new URL('https://adynami.ai'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Adynami',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Adynami',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description:
                'Conversational AI for Meta Advertising. Manage campaigns, audiences, and analytics through natural language.',
              url: 'https://adynami.ai',
              offers: {
                '@type': 'AggregateOffer',
                lowPrice: '39',
                highPrice: '349',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
