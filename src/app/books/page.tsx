'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import BookCard from '@/components/books/BookCard';
import AccessRequestModal from '@/components/modals/AccessRequestModal';
import BookReaderModal from '@/components/books/BookReaderModal';
import { useLanguage } from '@/context/LanguageContext';
import { BookItem } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Search, Loader2 } from 'lucide-react';

export default function BooksPage() {
  const { language, t } = useLanguage();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBookTitle, setSelectedBookTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReadingBook, setActiveReadingBook] = useState<BookItem | null>(null);

  useEffect(() => {
    const loadBooks = async () => {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBooks(data.filter((b: BookItem) => b.published));
      }
      setLoading(false);
    };

    loadBooks();
  }, []);

  const handleRequestAccess = (title: string) => {
    setSelectedBookTitle(title);
    setModalOpen(true);
  };

  const handleReadOnline = (book: BookItem) => {
    setActiveReadingBook(book);
  };

  const filteredBooks = books.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      (b.title_en && b.title_en.toLowerCase().includes(q)) ||
      (b.title_ur && b.title_ur.includes(searchTerm)) ||
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
                ? 'سراج الحق قریشی کی تمام مطبوعہ اور نایاب کتب، تحقیقی مقالات اور ادبی مضامین کا مکمل ریکارڈ۔'
                : 'Explore the complete bibliography, treatises, and published works of Siraj ul Haq Qureshi.'}
            </p>

            {/* Search Input */}
            {books.length > 0 && (
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
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-700 mb-3" />
              <p className="text-sm">{language === 'ur' ? 'کتب لوڈ ہو رہی ہیں...' : 'Loading books archive...'}</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            /* Books List */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onRequestAccess={handleRequestAccess}
                  onReadOnline={handleReadOnline}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="max-w-xl mx-auto text-center py-16 px-6 bg-white rounded-3xl border border-stone-200/80 shadow-xs">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-bold text-stone-800 mb-2 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                {language === 'ur' ? 'کتب خانہ مرتب کیا جا رہا ہے' : 'Publications Archive In Preparation'}
              </h3>
              <p className={`text-stone-600 text-sm leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
                {language === 'ur'
                  ? 'سراج الحق قریشی کے مسودات اور کتب کی تصدیق اور ڈیجیٹلائزیشن کا کام جاری ہے۔ جیسے ہی ایڈمن کی جانب سے کتب شامل کی جائیں گی، وہ یہاں قارئین کے لیے دستیاب ہوں گی۔'
                  : 'The literary works and manuscripts of Siraj ul Haq Qureshi are currently being cataloged and archived. As publications are added via the admin panel, they will appear here.'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <AccessRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resourceTitle={selectedBookTitle}
        resourceType="Book / Publication"
      />

      <BookReaderModal
        book={activeReadingBook}
        isOpen={activeReadingBook !== null}
        onClose={() => setActiveReadingBook(null)}
      />
    </div>
  );
}
