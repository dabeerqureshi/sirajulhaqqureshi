import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoNastaliq = Noto_Nastaliq_Urdu({
  variable: '--font-noto-nastaliq',
  subsets: ['arabic'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Siraj ul Haq Qureshi | سراج الحق قریشی — Digital Archive & Portfolio',
    template: '%s | Siraj ul Haq Qureshi',
  },
  description: 'Official Digital Archive, Poetry, Books, Manuscripts, and Literary Legacy of Siraj ul Haq Qureshi.',
  keywords: [
    'Siraj ul Haq Qureshi',
    'سراج الحق قریشی',
    'Urdu Poetry',
    'اردو شاعری',
    'Hamd Manuscripts',
    'Urdu Literature',
    'Digital Archive',
    'Philosophical Ghazals',
  ],
  authors: [{ name: 'Siraj ul Haq Qureshi' }],
  creator: 'Siraj ul Haq Qureshi Archives',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://sirajulhaqqureshi.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ur_PK',
    url: '/',
    title: 'Siraj ul Haq Qureshi | سراج الحق قریشی — Digital Archive',
    description: 'Preserving the poetry, handwritten manuscripts, books, and intellectual heritage of Siraj ul Haq Qureshi.',
    siteName: 'Siraj ul Haq Qureshi Digital Archive',
    images: [
      {
        url: '/gallery/siraj-profile.jpg',
        width: 1200,
        height: 630,
        alt: 'Siraj ul Haq Qureshi Digital Archive',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Siraj ul Haq Qureshi | سراج الحق قریشی',
    description: 'Preserving the poetry, handwritten manuscripts, books, and intellectual heritage of Siraj ul Haq Qureshi.',
    images: ['/gallery/siraj-profile.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Siraj ul Haq Qureshi',
  alternateName: 'سراج الحق قریشی',
  jobTitle: 'Poet, Scholar, Author',
  url: 'https://sirajulhaqqureshi.com',
  sameAs: [],
  description: 'Renowned Urdu poet, writer, and intellectual whose works span philosophical ghazals, sacred Hamd manuscripts, and literary essays.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoNastaliq.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-200 selection:text-amber-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
