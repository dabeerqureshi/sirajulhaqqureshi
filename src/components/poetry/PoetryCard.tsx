'use client';

import React from 'react';
import { ContentItem } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';
import { Lock, Feather, Sparkles } from 'lucide-react';

interface PoetryCardProps {
  poetry: ContentItem;
  onRequestAccess?: (title: string) => void;
}

export default function PoetryCard({ poetry, onRequestAccess }: PoetryCardProps) {
  const { language } = useLanguage();
  const isRestricted = poetry.visibility === 'restricted';

  return (
    <article className="relative bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-6 sm:p-8">
      {/* Top Bar with Badge */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-amber-700" />
          <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
            {language === 'ur' ? 'کلامِ سراج' : 'Poetic Verse'}
          </span>
        </div>

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

      {/* Titles */}
      <div className="text-center mb-6">
        <h3 className={`text-xl sm:text-2xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
          {language === 'ur' ? poetry.title_ur : poetry.title_en}
        </h3>
        {(poetry.subtitle_en || poetry.subtitle_ur) && (
          <p className="text-xs text-stone-500 mt-1 italic">
            {language === 'ur' ? poetry.subtitle_ur : poetry.subtitle_en}
          </p>
        )}
      </div>

      {/* Verses / Couplets */}
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
              onClick={() => onRequestAccess && onRequestAccess(poetry.title_en)}
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
        <div className="space-y-6 my-4">
          {poetry.verses && poetry.verses.map((verse, idx) => (
            <div key={idx} className="bg-stone-50/60 p-4 rounded-xl border border-stone-100 text-center">
              {/* Urdu verse (Nastaliq centered) */}
              <p className="font-urdu text-xl sm:text-2xl text-stone-900 leading-loose whitespace-pre-line py-2">
                {verse.ur}
              </p>
              {/* English poetic translation */}
              {verse.en && (
                <p className="text-sm font-serif italic text-stone-600 border-t border-stone-200/60 pt-2.5 mt-2 whitespace-pre-line">
                  &ldquo;{verse.en}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
