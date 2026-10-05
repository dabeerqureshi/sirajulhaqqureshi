'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import PoetryCard from '@/components/poetry/PoetryCard';
import BookCard from '@/components/books/BookCard';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import AccessRequestModal from '@/components/modals/AccessRequestModal';
import { useLanguage } from '@/context/LanguageContext';
import { mockIntro, mockBiography, mockPoetry, mockBooks, mockGallery } from '@/lib/data/mockData';
import { Feather, BookOpen, Image as ImageIcon, ArrowRight, Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { language, t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemTitle, setSelectedItemTitle] = useState('');

  const handleRequestAccess = (title: string) => {
    setSelectedItemTitle(title);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-950 via-stone-900 to-stone-900 text-white py-20 lg:py-28">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Text column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? 'ڈیجیٹل آرکائیو اور ادبی ورثہ' : 'Official Digital Archive'}</span>
                </div>

                <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight ${language === 'ur' ? 'font-urdu leading-normal' : 'font-serif'}`}>
                  {language === 'ur' ? mockIntro.title_ur : mockIntro.title_en}
                </h1>

                <p className={`text-lg sm:text-xl text-amber-200/90 font-medium ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                  {language === 'ur' ? mockIntro.subtitle_ur : mockIntro.subtitle_en}
                </p>

                <p className={`text-sm sm:text-base text-stone-300 leading-relaxed max-w-2xl ${language === 'ur' ? 'font-urdu' : ''}`}>
                  {language === 'ur' ? mockIntro.body_ur : mockIntro.body_en}
                </p>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    href="/books"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold shadow-lg shadow-amber-950/40 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{language === 'ur' ? 'کتب و تصانیف کا مطالعہ کریں' : 'Explore Books & Library'}</span>
                  </Link>

                  <Link
                    href="/poetry"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-800/90 hover:bg-stone-800 text-stone-200 border border-stone-700 text-sm font-semibold transition-all"
                  >
                    <Feather className="w-4 h-4 text-amber-400" />
                    <span>{language === 'ur' ? 'شاعری پڑھیں' : 'Read Poetry'}</span>
                  </Link>
                </div>
              </div>

              {/* Portrait / Visual Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md rounded-3xl p-3 bg-gradient-to-tr from-amber-700/30 to-stone-800 border border-stone-700 shadow-2xl">
                  <div className="aspect-4/5 rounded-2xl overflow-hidden relative shadow-inner bg-stone-950">
                    <img
                      src={mockIntro.cover_image || ''}
                      alt="Siraj ul Haq Qureshi"
                      className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
                    <div className="absolute bottom-5 inset-x-5 text-center">
                      <p className="font-serif text-amber-200 text-lg font-bold">
                        {language === 'ur' ? 'سراج الحق قریشی' : 'Siraj ul Haq Qureshi'}
                      </p>
                      <p className="text-xs text-stone-300">1932 — 2018</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* BIOGRAPHY PREVIEW */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs uppercase tracking-widest text-amber-800 font-bold">
                {language === 'ur' ? 'تعارف و سوانح' : 'Legacy & Life'}
              </span>
              <h2 className={`text-2xl sm:text-3xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                {language === 'ur' ? mockBiography.title_ur : mockBiography.title_en}
              </h2>
              <p className={`text-sm sm:text-base text-stone-600 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
                {language === 'ur' ? mockBiography.body_ur : mockBiography.body_en}
              </p>
              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-900"
                >
                  <span>{language === 'ur' ? 'مکمل سوانحِ حیات پڑھیں' : 'Read Full Biography'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-md">
                <img
                  src={mockBiography.cover_image || ''}
                  alt="Scholarly study"
                  className="w-full h-56 object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED POETRY SECTION */}
        <section className="py-16 bg-stone-100/60 border-y border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-800 font-bold">
                  {language === 'ur' ? 'منتخب کلام' : 'Poetry Archive'}
                </span>
                <h2 className={`text-2xl sm:text-3xl font-bold text-stone-900 mt-1 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                  {t('recentPoetry')}
                </h2>
              </div>
              <Link
                href="/poetry"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-900"
              >
                <span>{t('viewAll')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockPoetry.slice(0, 3).map((poem) => (
                <PoetryCard
                  key={poem.id}
                  poetry={poem}
                  onRequestAccess={handleRequestAccess}
                />
              ))}
            </div>
          </div>
        </section>

        {/* BOOKS & PUBLICATIONS SECTION */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-800 font-bold">
                {language === 'ur' ? 'کتب خانہ' : 'Published Works'}
              </span>
              <h2 className={`text-2xl sm:text-3xl font-bold text-stone-900 mt-1 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                {t('featuredWorks')}
              </h2>
            </div>
            <Link
              href="/books"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-900"
            >
              <span>{t('viewAll')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {mockBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onRequestAccess={handleRequestAccess}
              />
            ))}
          </div>
        </section>

        {/* GALLERY HIGHLIGHTS */}
        <section className="py-20 bg-stone-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                  {language === 'ur' ? 'تصویری یادداشتیں' : 'Visual Legacy'}
                </span>
                <h2 className={`text-2xl sm:text-3xl font-bold text-white mt-1 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                  {t('photoArchives')}
                </h2>
              </div>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300"
              >
                <span>{t('viewAll')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <GalleryGrid
              items={mockGallery.slice(0, 3)}
              onRequestAccess={handleRequestAccess}
            />
          </div>
        </section>
      </main>

      <Footer />

      <AccessRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resourceTitle={selectedItemTitle}
      />
    </div>
  );
}
