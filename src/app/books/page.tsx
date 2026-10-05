'use client';

import React, { useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import BookCard from '@/components/books/BookCard';
import AccessRequestModal from '@/components/modals/AccessRequestModal';
import { useLanguage } from '@/context/LanguageContext';
import { mockBooks } from '@/lib/data/mockData';
import { BookOpen, Search, DownloadCloud } from 'lucide-react';

export default function BooksPage() {
  const { language, t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBookTitle, setSelectedBookTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleRequestAccess = (title: string) => {
    setSelectedBookTitle(title);
    setModalOpen(true);
  };

  const filteredBooks = mockBooks.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      b.title_en.toLowerCase().includes(q) ||
      b.title_ur.includes(searchTerm) ||
      (b.category && b.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ur' ? 'کتب خانہ اور تصانیف' : 'Library & Publications'}</span>
            </div>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {t('navBooks')}
            </h1>
            <p className={`text-stone-600 text-sm sm:text-base leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'سراج الحق قریشی کی تمام مطبوعہ اور نایاب کتب، تحقیقی مقالات اور ادبی مضامین کا مکمل ریکارڈ۔ کتب کا آن لائن مطالعہ کریں یا پی ڈی ایف ڈاؤن لوڈ کریں۔'
                : 'Explore the complete bibliography, treatises, and published works of Siraj ul Haq Qureshi. Download digital editions or request access to restricted manuscripts.'}
            </p>

            {/* Search Input */}
            <div className="relative max-w-md mx-auto pt-4">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-7" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ur' ? 'کتاب کا عنوان یا زمرہ تلاش کریں...' : 'Search books by title or topic...'}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30 shadow-xs"
              />
            </div>
          </div>

          {/* Books List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onRequestAccess={handleRequestAccess}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />

      <AccessRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resourceTitle={selectedBookTitle}
        resourceType="Book / Publication"
      />
    </div>
  );
}
