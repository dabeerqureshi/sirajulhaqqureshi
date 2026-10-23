'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import PoetryCard from '@/components/poetry/PoetryCard';
import BookCard from '@/components/books/BookCard';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import AccessRequestModal from '@/components/modals/AccessRequestModal';
import BookReaderModal from '@/components/books/BookReaderModal';
import { useLanguage } from '@/context/LanguageContext';
import { BookItem, ContentItem, GalleryItem } from '@/types/database';
import { mockIntro, mockBiography, mockGallery } from '@/lib/data/mockData';
import { createClient } from '@/lib/supabase/client';
import { Feather, ArrowRight, Sparkles, ScrollText } from 'lucide-react';

export default function HomePage() {
  const { language, t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemTitle, setSelectedItemTitle] = useState('');
  const [activeReadingBook, setActiveReadingBook] = useState<BookItem | null>(null);

  const [poetry, setPoetry] = useState<ContentItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>(mockGallery.slice(0, 3));

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      if (!supabase) return;

      const [poemsRes, booksRes, galleryRes] = await Promise.all([
        supabase
          .from('content')
          .select('*')
          .eq('type', 'poetry')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('books')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('gallery')
          .select('*')
          .order('sort_order', { ascending: true })
          .limit(3),
      ]);

      if (poemsRes.data && poemsRes.data.length > 0) {
        setPoetry(poemsRes.data);
      }
      if (booksRes.data && booksRes.data.length > 0) {
        setBooks(booksRes.data);
      }
      if (galleryRes.data && galleryRes.data.length > 0) {
        setGallery(galleryRes.data);
      }
    };

    loadData();
  }, []);

  const handleRequestAccess = (title: string) => {
    setSelectedItemTitle(title);
    setModalOpen(true);
  };

  const handleReadOnline = (book: BookItem) => {
    setActiveReadingBook(book);
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
                    href="/poetry"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold shadow-lg shadow-amber-950/40 transition-all"
                  >
                    <Feather className="w-4 h-4 text-amber-200" />
                    <span>{language === 'ur' ? 'حمد و کلام کا مطالعہ کریں' : 'Read Hamd & Poetry'}</span>
                  </Link>

                  <Link
                    href="/gallery"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-800/90 hover:bg-stone-800 text-stone-200 border border-stone-700 text-sm font-semibold transition-all"
                  >
                    <span>{language === 'ur' ? 'تصویری دستاویزات' : 'Explore Gallery'}</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </Link>
                </div>
              </div>

              {/* Portrait / Visual Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md rounded-3xl p-3 bg-black border border-stone-800 shadow-2xl">
                  <div className="aspect-4/5 rounded-2xl overflow-hidden relative shadow-inner bg-black">
                    <img
                      src={mockIntro.cover_image || ''}
                      alt="Siraj ul Haq Qureshi"
                      className="w-full h-full object-contain object-center filter brightness-95 contrast-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
                    <div className="absolute bottom-5 inset-x-5 text-center">
                      <p className="font-serif text-amber-200 text-lg font-bold">
                        {language === 'ur' ? 'سراج الحق قریشی' : 'Siraj ul Haq Qureshi'}
                      </p>
                      <p className="text-xs text-stone-300">1940 - 2026</p>
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
              <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 flex items-center justify-center p-2 shadow-md">
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-md opacity-35 scale-125"
                  style={{ backgroundImage: `url(${mockBiography.cover_image || '/gallery/siraj-04.jpg'})` }}
                />
                <img
                  src={mockBiography.cover_image || '/gallery/siraj-04.jpg'}
                  alt="Siraj ul Haq Qureshi Formal Portrait"
                  className="relative z-10 max-h-full max-w-full object-contain rounded-lg"
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
                  {language === 'ur' ? 'منتخب کلام و حمد' : 'Poetry & Hamd Archive'}
                </span>
                <h2 className={`text-2xl sm:text-3xl font-bold text-stone-900 mt-1 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                  {language === 'ur' ? 'حمدیہ مسودات اور شعری ورثہ' : 'Hamd Manuscripts & Poetic Legacy'}
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

            {poetry.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {poetry.map((poem) => (
                  <PoetryCard
                    key={poem.id}
                    poetry={poem}
                    onRequestAccess={handleRequestAccess}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 text-center max-w-2xl mx-auto space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                  <ScrollText className="w-7 h-7" />
                </div>
                <h3 className={`text-xl font-bold text-stone-800 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                  {language === 'ur' ? 'حمد و مناجات کے اصل قلمی نسخے' : 'Original Hamd Manuscripts'}
                </h3>
                <p className={`text-sm text-stone-600 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
                  {language === 'ur'
                    ? 'سراج الحق قریشی کے دستخط شدہ حمدیہ کلام کے اصل محفوظ صفحات کو ڈیجیٹل فارمیٹ میں پیش کیا گیا ہے۔'
                    : 'The authentic handwritten Hamd manuscripts authored by Siraj ul Haq Qureshi are preserved and available for digital reading.'}
                </p>
                <div>
                  <Link
                    href="/poetry"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold transition-all shadow-xs"
                  >
                    <span>{language === 'ur' ? 'حمدیہ صفحات ملاحظہ کریں' : 'Read Hamd Manuscripts'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* BOOKS SECTION (Rendered if published books exist) */}
        {books.length > 0 && (
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
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onRequestAccess={handleRequestAccess}
                  onReadOnline={handleReadOnline}
                />
              ))}
            </div>
          </section>
        )}

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
              items={gallery}
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

      <BookReaderModal
        book={activeReadingBook}
        isOpen={activeReadingBook !== null}
        onClose={() => setActiveReadingBook(null)}
      />
    </div>
  );
}
