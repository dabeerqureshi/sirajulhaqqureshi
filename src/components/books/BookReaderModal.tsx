'use client';

import React, { useState } from 'react';
import { BookItem } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  Download,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface BookReaderModalProps {
  book: BookItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookReaderModal({ book, isOpen, onClose }: BookReaderModalProps) {
  const { language, t } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'interactive' | 'pdf'>('interactive');

  if (!isOpen || !book) return null;

  const totalPages = book.pages_count || 120;

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  // Realistic sample chapter contents for the interactive reader
  const sampleChapters = [
    {
      title_en: 'Prologue & Literary Preface',
      title_ur: 'پیش لفظ اور دیباچہ',
      content_ur: `ادب محض الفاظ کا مجموعہ نہیں بلکہ قوموں کی فکری، اخلاقی اور روحانی بیداری کا آئینہ دار ہوتا ہے۔ یہ کتاب انسانی دل کی گہرائیوں اور کائنات کے پوشیدہ اسرار کا ایک فکری احاطہ ہے۔

ستاروں سے آگے جہاں اور بھی ہیں
ابھی عشق کے امتحاں اور بھی ہیں

ہم نے اس مجموعے میں اپنے فکری سفر کی وہ تمام منزلیں قلمبند کی ہیں جو انسانی جستجو اور سچائی کی تلاش میں طے ہوئیں۔ قاری کو اس مطالعے میں وہ تمام شعری و نثری نقوش ملیں گے جو آنے والے زمانوں کے لیے رہنمائی کا باعث بن سکتے ہیں۔`,
      content_en: `Literature is not merely a collection of words; it serves as a profound mirror reflecting the moral, intellectual, and spiritual awakening of human society. This work represents a meditative exploration into the depths of human consciousness and universal truth.

"Beyond the stars, there are other worlds still;
There are more trials awaiting passion and will."

Across these pages, we have chronicled the milestones of a lifetime devoted to knowledge, poetic beauty, and ethical conscience.`
    },
    {
      title_en: 'Chapter I: Philosophy of Eastern Thought',
      title_ur: 'باب اوّل: مشرقی فکر اور اقدار',
      content_ur: `مشرقی تہذیب میں فکر و اخلاق کی بنیاد روحانی ہم آہنگی پر استوار ہے۔ علم وہی معتبر ہے جو انسان کو اپنی حقیقت سے روشناس کرائے اور دل میں دوسروں کے لیے درد اور محبت پیدا کرے۔

اندھیروں میں جلا کے دل کا دیا چلے ہیں
ہم راہِ حق پہ بے خوف و فغاں چلے ہیں

سچی دانش وہ ہے جو انسان کو انانیت اور خود غرضی کے حصار سے نکال کر اجتماعی خیر اور اخوت کے دائرے میں داخل کرے۔`,
      content_en: `In the Eastern intellectual tradition, the cornerstone of knowledge is spiritual harmony and ethical responsibility. True enlightenment awakens an acute awareness of human dignity, fostering compassion, brotherhood, and devotion to truth.`
    }
  ];

  const currentChapter = sampleChapters[(currentPage - 1) % sampleChapters.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-2 sm:p-4 animate-fade-in">
      <div
        className={`relative w-full bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-stone-800 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'h-full max-h-screen rounded-none' : 'max-w-5xl h-[92vh]'
        }`}
      >
        {/* TOP BAR: HEADER & CONTROLS */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-800 bg-stone-950/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-amber-900/60 text-amber-300 flex items-center justify-center shrink-0 border border-amber-700/50">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h2 className={`text-sm sm:text-base font-bold text-white truncate ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                {language === 'ur' ? book.title_ur : book.title_en}
              </h2>
              <p className="text-[11px] text-stone-400">
                {language === 'ur' ? book.author_ur : book.author_en} • {book.category}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700 text-xs">
              <button
                onClick={() => setViewMode('interactive')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'interactive' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                Manuscript View
              </button>
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'pdf' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                Raw PDF
              </button>
            </div>

            {/* Direct Download Button */}
            <a
              href={book.file_path || '#'}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('downloadPdf')}</span>
            </a>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="Close reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* READER MAIN BODY */}
        <div className="flex-1 overflow-y-auto bg-stone-950 flex justify-center p-4 sm:p-8">
          {viewMode === 'pdf' && book.file_path ? (
            /* Embedded PDF Frame View */
            <div className="w-full h-full rounded-xl overflow-hidden border border-stone-800 bg-stone-900 shadow-2xl">
              <iframe
                src={`${book.file_path}#view=FitH`}
                title={book.title_en}
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            /* Interactive Book Reader Page View */
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-3xl bg-[#fdfbf7] text-stone-900 rounded-xl shadow-2xl border border-stone-300 p-8 sm:p-14 min-h-[600px] flex flex-col justify-between transition-transform duration-200"
            >
              {/* Top Page Header */}
              <div className="border-b border-stone-200 pb-4 flex items-center justify-between text-xs text-stone-400 font-serif">
                <span>{book.title_en}</span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>

              {/* Main Chapter Content */}
              <div className="py-8 space-y-8 flex-1">
                <div className="text-center space-y-2">
                  <h3 className={`text-2xl sm:text-3xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                    {language === 'ur' ? currentChapter.title_ur : currentChapter.title_en}
                  </h3>
                  <div className="w-16 h-0.5 bg-amber-800/40 mx-auto"></div>
                </div>

                {/* Urdu Calligraphic Section */}
                <div className="bg-stone-50/70 p-6 rounded-2xl border border-stone-200/80">
                  <p className="font-urdu text-xl sm:text-2xl text-stone-900 leading-loose text-right whitespace-pre-line">
                    {currentChapter.content_ur}
                  </p>
                </div>

                {/* English Scholarly Translation */}
                <div className="pt-2">
                  <p className="text-sm font-serif leading-relaxed text-stone-700 whitespace-pre-line">
                    {currentChapter.content_en}
                  </p>
                </div>
              </div>

              {/* Bottom Page Footer */}
              <div className="border-t border-stone-200 pt-4 flex items-center justify-between text-xs text-stone-400">
                <span className="font-serif italic">Siraj ul Haq Qureshi Archives</span>
                <span className="font-bold text-stone-600">~ {currentPage} ~</span>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION CONTROLS */}
        <div className="px-4 sm:px-6 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between shrink-0 text-xs">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
              className="p-1.5 rounded-md hover:bg-stone-800 text-stone-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-stone-400 w-10 text-center font-mono">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 140))}
              className="p-1.5 rounded-md hover:bg-stone-800 text-stone-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Page Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <span className="text-stone-300 font-medium">
              Page <span className="text-amber-400 font-bold">{currentPage}</span> of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Jump input */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-stone-400">Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= totalPages) setCurrentPage(val);
              }}
              className="w-12 px-1.5 py-1 rounded bg-stone-900 border border-stone-700 text-center text-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
