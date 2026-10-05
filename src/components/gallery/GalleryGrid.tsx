'use client';

import React, { useState } from 'react';
import { GalleryItem } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';
import { Lock, Eye, Calendar, Sparkles, Filter } from 'lucide-react';

interface GalleryGridProps {
  items: GalleryItem[];
  onRequestAccess: (title: string) => void;
}

export default function GalleryGrid({ items, onRequestAccess }: GalleryGridProps) {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category || 'General')))];

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-stone-400 flex-shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat === 'All' ? (language === 'ur' ? 'تمام' : 'All') : cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isRestricted = item.visibility === 'restricted';

          return (
            <div
              key={item.id}
              className="group relative bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col"
            >
              {/* Image Frame */}
              <div className="relative h-64 w-full overflow-hidden bg-stone-900">
                <img
                  src={item.file_path}
                  alt={item.title_en}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    isRestricted ? 'filter blur-md brightness-75 scale-105 select-none' : ''
                  }`}
                />

                {/* Restricted overlay banner */}
                {isRestricted ? (
                  <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 flex items-center justify-center mb-3">
                      <Lock className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-200 mb-1">
                      {language === 'ur' ? 'مخصوص دستاویز' : 'Restricted Archive'}
                    </span>
                    <p className={`text-xs text-stone-300 mb-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
                      {language === 'ur' ? 'خاندانی اور تاریخی ذخیرہ' : 'Authorized researchers & family only'}
                    </p>
                    <button
                      onClick={() => onRequestAccess(item.title_en)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shadow-md transition-colors"
                    >
                      {t('requestAccess')}
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <button
                      onClick={() => setActivePhoto(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-stone-900 text-xs font-medium backdrop-blur-xs shadow-md"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === 'ur' ? 'بڑا دیکھیں' : 'View Full Image'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Caption & Metadata */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span className="font-medium text-amber-800">{item.category}</span>
                    {item.taken_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.taken_date}
                      </span>
                    )}
                  </div>
                  <h4 className={`text-base font-bold text-stone-900 mb-1.5 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                    {language === 'ur' ? item.title_ur : item.title_en}
                  </h4>
                  <p className={`text-xs text-stone-600 line-clamp-2 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
                    {language === 'ur' ? item.description_ur : item.description_en}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal for Public Photos */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="max-w-4xl w-full bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[70vh] bg-black flex items-center justify-center">
              <img
                src={activePhoto.file_path}
                alt={activePhoto.title_en}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-bold ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                  {language === 'ur' ? activePhoto.title_ur : activePhoto.title_en}
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  {language === 'ur' ? activePhoto.description_ur : activePhoto.description_en}
                </p>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-200"
              >
                {language === 'ur' ? 'بند کریں' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
