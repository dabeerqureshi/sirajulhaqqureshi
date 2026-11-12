'use client';

import React from 'react';
import Image from 'next/image';
import { BookItem } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getStorageUrl } from '@/lib/supabase/storage';
import { BookOpen, Lock, Calendar, FileText } from 'lucide-react';

interface BookCardProps {
  book: BookItem;
  onRequestAccess?: (title: string, id?: string) => void;
  onReadOnline?: (book: BookItem) => void;
}

export default function BookCard({ book, onRequestAccess, onReadOnline }: BookCardProps) {
  const { language, t } = useLanguage();
  const { hasAccessFor } = useAuth();
  const isRestricted = book.visibility === 'restricted';
  const canAccess = !isRestricted || hasAccessFor('books', book.id);

  const coverUrl = getStorageUrl(book.cover_path);
  // Never expose or resolve file_path directly if unauthorized to prevent DevTools / network inspection leaks
  const fileUrl = canAccess ? getStorageUrl(book.file_path) : '';

  const handleRead = () => {
    if (!canAccess) {
      if (onRequestAccess) onRequestAccess(book.title_en, book.id);
    } else if (onReadOnline) {
      onReadOnline({ ...book, file_path: fileUrl });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all group">
      {/* Book Cover */}
      <div
        onClick={handleRead}
        className="sm:w-52 h-64 sm:h-auto relative bg-gradient-to-br from-amber-950 to-stone-900 shrink-0 flex items-center justify-center p-4 cursor-pointer"
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={book.title_en}
            width={200}
            height={280}
            className="max-w-full max-h-full object-contain rounded-md shadow-md group-hover:scale-105 transition-transform duration-300"
            unoptimized={coverUrl.startsWith('data:')}
          />
        ) : (
          <div className="text-center text-amber-100 p-4 border border-amber-800/40 rounded flex flex-col items-center justify-center h-full">
            <BookOpen className="w-10 h-10 mb-2 text-amber-400" />
            <span className="font-serif text-sm font-bold line-clamp-2">
              {book.title_en}
            </span>
          </div>
        )}

        {!canAccess && (
          <div className="absolute top-3 right-3 bg-rose-900/90 text-white p-1.5 rounded-full shadow-md">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Book Details */}
      <div className="p-6 flex flex-col justify-between flex-1">
        <div>
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-900 border border-amber-200">
              {book.category}
            </span>
            {book.published_year && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                <Calendar className="w-3 h-3" />
                {book.published_year}
              </span>
            )}
            {book.pages_count && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                <FileText className="w-3 h-3" />
                {book.pages_count} {language === 'ur' ? 'صفحات' : 'pages'}
              </span>
            )}
          </div>

          <h3 className={`text-xl font-bold text-stone-900 mb-1 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
            {language === 'ur' ? book.title_ur : book.title_en}
          </h3>

          <p className="text-xs text-amber-800 font-semibold mb-3">
            {language === 'ur' ? book.author_ur : book.author_en}
          </p>

          <p className={`text-sm text-stone-600 line-clamp-3 mb-4 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
            {language === 'ur' ? book.description_ur : book.description_en}
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-stone-400">
            {book.download_count} {language === 'ur' ? 'ڈاؤن لوڈز' : 'downloads'}
          </span>

          {!canAccess ? (
            <button
              onClick={() => onRequestAccess && onRequestAccess(book.title_en, book.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-amber-300 hover:bg-stone-800 text-xs font-medium shadow-xs transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('requestAccess')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRead}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <BookOpen className="w-4 h-4 text-amber-200" />
                <span>{language === 'ur' ? 'کتاب کا مطالعہ کریں' : 'Read Book Online'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
