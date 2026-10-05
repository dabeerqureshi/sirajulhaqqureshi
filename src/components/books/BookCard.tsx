'use client';

import React from 'react';
import Image from 'next/image';
import { BookItem } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';
import { BookOpen, Download, Lock, Check, Calendar, FileText } from 'lucide-react';

interface BookCardProps {
  book: BookItem;
  onRequestAccess?: (title: string) => void;
}

export default function BookCard({ book, onRequestAccess }: BookCardProps) {
  const { language, t } = useLanguage();
  const isRestricted = book.visibility === 'restricted';

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRestricted) {
      if (onRequestAccess) onRequestAccess(book.title_en);
    } else {
      alert(`Downloading ${language === 'ur' ? book.title_ur : book.title_en}... (PDF)`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
      {/* Book Cover */}
      <div className="sm:w-48 h-64 sm:h-auto relative bg-gradient-to-br from-amber-950 to-stone-900 flex-shrink-0 flex items-center justify-center p-4">
        {book.cover_path ? (
          <img
            src={book.cover_path}
            alt={book.title_en}
            className="w-full h-full object-cover rounded shadow-md group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-center text-amber-100 p-4 border border-amber-800/40 rounded flex flex-col items-center justify-center h-full">
            <BookOpen className="w-10 h-10 mb-2 text-amber-400" />
            <span className="font-serif text-sm font-bold line-clamp-2">
              {book.title_en}
            </span>
          </div>
        )}

        {isRestricted && (
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
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-700">
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

          {isRestricted ? (
            <button
              onClick={() => onRequestAccess && onRequestAccess(book.title_en)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-amber-300 hover:bg-stone-800 text-xs font-medium shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('requestAccess')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 text-white hover:bg-amber-900 text-xs font-medium shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('downloadPdf')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
