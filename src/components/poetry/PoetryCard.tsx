'use client';

import React from 'react';
import { ContentItem, PoetryVerse } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';
import { getStorageUrl } from '@/lib/supabase/storage';
import {
  Lock,
  Feather,
  Sparkles,
  FileText,
  Calendar,
} from 'lucide-react';
import InlinePoetryReader from '@/components/poetry/InlinePoetryReader';

interface PoetryCardProps {
  poetry: ContentItem;
  onRequestAccess?: (title: string) => void;
}

export default function PoetryCard({ poetry, onRequestAccess }: PoetryCardProps) {
  const { language } = useLanguage();

  const isRestricted = poetry.visibility === 'restricted';
  const mediaPath = poetry.cover_image || poetry.file_path || null;
  const resolvedUrl = mediaPath ? getStorageUrl(mediaPath) : null;

  const isPdf = Boolean(
    resolvedUrl &&
      (resolvedUrl.toLowerCase().includes('.pdf') ||
        resolvedUrl.startsWith('data:application/pdf'))
  );
  const isImage = Boolean(resolvedUrl && !isPdf);

  // Parse verses safely whether array, stringified JSON, or null
  let parsedVerses: PoetryVerse[] = [];
  try {
    if (Array.isArray(poetry.verses)) {
      parsedVerses = poetry.verses;
    } else if (typeof poetry.verses === 'string') {
      const parsed = JSON.parse(poetry.verses);
      if (Array.isArray(parsed)) parsedVerses = parsed;
    }
  } catch {
    parsedVerses = [];
  }

  // Filter out completely empty verses
  const validVerses = parsedVerses.filter(
    (v) => (v.ur && v.ur.trim().length > 0) || (v.en && v.en.trim().length > 0)
  );

  const displayTitle = language === 'ur' ? poetry.title_ur || poetry.title_en : poetry.title_en || poetry.title_ur;
  const displaySubtitle = language === 'ur' ? poetry.subtitle_ur || poetry.subtitle_en : poetry.subtitle_en || poetry.subtitle_ur;

  return (
    <article className="relative bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden p-6 sm:p-7 flex flex-col justify-between">
      <div>
        {/* Top Bar with Badge */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5 mb-5">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-amber-700" />
            <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
              {language === 'ur' ? 'کلامِ سراج' : 'Poetic Verse'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isPdf && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </span>
            )}
            {isRestricted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3" />
                {language === 'ur' ? 'مخصوص رسائی' : 'Restricted'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3" />
                {language === 'ur' ? 'عام' : 'Public'}
              </span>
            )}
          </div>
        </div>

        {/* Titles */}
        <div className="text-center mb-5">
          <h3
            className={`text-xl sm:text-2xl font-bold text-stone-900 ${
              language === 'ur' ? 'font-urdu' : 'font-serif'
            }`}
          >
            {displayTitle}
          </h3>
          {displaySubtitle && (
            <p className="text-xs text-stone-500 mt-1 italic">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Restricted View State */}
        {isRestricted ? (
          <div className="relative py-8 text-center bg-stone-50/70 rounded-xl border border-dashed border-stone-200 my-4">
            <div className="absolute inset-0 backdrop-blur-xs flex flex-col items-center justify-center p-4">
              <div className="w-10 h-10 rounded-full bg-stone-200/90 text-stone-700 flex items-center justify-center mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs text-stone-600 max-w-xs mb-3 font-medium">
                {language === 'ur'
                  ? 'یہ کلام نجی ذخیرے میں محفوظ ہے۔ مطالعہ کے لیے رسائی درکار ہے۔'
                  : 'This poem is reserved in the private collection. Request access to read.'}
              </p>
              <button
                type="button"
                onClick={() => onRequestAccess && onRequestAccess(poetry.title_en || poetry.title_ur)}
                className="px-4 py-1.5 bg-amber-800 text-white rounded-lg text-xs font-medium hover:bg-amber-900 transition-colors shadow-xs"
              >
                {language === 'ur' ? 'رسائی کی درخواست کریں' : 'Request Access'}
              </button>
            </div>
            <div className="filter blur-sm select-none opacity-40 space-y-4">
              <p className="font-urdu text-lg">رازِ نہاں جو سینے میں موجزن رہا</p>
              <p className="font-urdu text-lg">وہ حرفِ دعا بن کے لبوں پر عیاں ہوا</p>
            </div>
          </div>
        ) : (
          /* Public Interactive Inline Reader (Scroll, Zoom, Minimize, Maximize) */
          <div className="my-4">
            <InlinePoetryReader
              title={displayTitle}
              documentUrl={resolvedUrl}
              isPdf={isPdf}
              isImage={isImage}
              verses={validVerses}
              downloadUrl={resolvedUrl}
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-stone-100 mt-4 flex items-center justify-between text-[11px] text-stone-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {poetry.created_at
            ? new Date(poetry.created_at).toLocaleDateString(
                language === 'ur' ? 'ur-PK' : 'en-US',
                { year: 'numeric', month: 'short', day: 'numeric' }
              )
            : 'Archive'}
        </span>

        <span className="text-amber-800 font-medium">
          {isPdf ? (language === 'ur' ? 'پی ڈی ایف مسودہ' : 'PDF Document') : isImage ? (language === 'ur' ? 'تصویری مسودہ' : 'Scan') : (language === 'ur' ? 'منظوم کلام' : 'Verses')}
        </span>
      </div>
    </article>
  );
}
