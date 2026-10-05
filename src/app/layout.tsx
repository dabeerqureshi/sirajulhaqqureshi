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
  title: 'Siraj ul Haq Qureshi | سراج الحق قریشی — Digital Archive & Portfolio',
  description: 'Official Digital Archive, Poetry, Books, and Literary Legacy of Siraj ul Haq Qureshi',
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
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
