'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FileText, RefreshCw, Sparkles } from 'lucide-react';
import { getHamdItems, hamdDownloadUrl, hamdFileUrl } from '@/lib/data/hamd';
import { useLanguage } from '@/context/LanguageContext';
import type { ContentItem } from '@/types/database';
import InlinePoetryReader from '@/components/poetry/InlinePoetryReader';

/**
 * "Hamd" section of the Poetry page.
 * Lists every published Hamd manuscript uploaded from the admin portal and lets
 * visitors read it directly on the website with scroll, minimize, maximize, and zoom.
 */
export default function HamdSection() {
  const { language } = useLanguage();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { items: rows, error } = await getHamdItems();
    setLoadError(error);
    setItems(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- getHamdItems() is an async call; setState runs after promise resolves
    load();
  }, [load]);

  /* ------------------------------ Loading ------------------------------ */
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 animate-pulse"
          >
            <div className="h-4 w-28 bg-stone-200 rounded mb-6" />
            <div className="h-6 w-3/4 bg-stone-200 rounded mx-auto mb-4" />
            <div className="h-48 bg-stone-100 rounded-xl" />
            <div className="h-9 w-40 bg-stone-200 rounded-xl mt-6 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  /* -------------------------------- Error ------------------------------- */
  if (loadError) {
    return (
      <div className="max-w-xl mx-auto text-center bg-white border border-rose-200 rounded-2xl p-8 space-y-3">
        <p className="text-sm text-rose-700 font-medium">
          {language === 'ur'
            ? 'حمد کے پی ڈی ایف حاصل کرنے میں مسئلہ پیش آ گیا۔'
            : 'Could not load the Hamd PDFs right now.'}
        </p>
        <p className="text-xs text-stone-500 break-all">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-amber-300 hover:bg-stone-800 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{language === 'ur' ? 'دوبارہ کوشش کریں' : 'Try Again'}</span>
        </button>
      </div>
    );
  }

  /* ------------------------------ Empty state ---------------------------- */
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center bg-white border border-dashed border-stone-300 rounded-2xl p-10 space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <p className={`text-stone-700 font-semibold ${language === 'ur' ? 'font-urdu text-lg' : ''}`}>
          {language === 'ur'
            ? 'ابھی کوئی حمد پی ڈی ایف شائع نہیں ہوئی'
            : 'No Hamd PDFs have been published yet'}
        </p>
        <p className={`text-xs text-stone-500 ${language === 'ur' ? 'font-urdu' : ''}`}>
          {language === 'ur'
            ? 'جدید حمدیں ایڈمن پورٹل سے اپ لوڈ کی جاتی ہیں۔ بہت جلد دستیاب ہوں گی۔'
            : 'New Hamd PDFs are uploaded from the admin portal and will appear here.'}
        </p>
      </div>
    );
  }

  /* -------------------------------- Cards -------------------------------- */
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((item) => {
        const fileUrl = hamdFileUrl(item.file_path);
        const downloadUrl = hamdDownloadUrl(item.file_path);
        const displayTitle = language === 'ur' ? item.title_ur || item.title_en : item.title_en || item.title_ur;
        const displaySubtitle = language === 'ur' ? item.subtitle_ur || item.subtitle_en : item.subtitle_en || item.subtitle_ur;

        return (
          <article
            key={item.id}
            className="relative bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              {/* Top Bar */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
                    {language === 'ur' ? 'حمدیہ کلام' : 'Sacred Hamd'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {language === 'ur' ? 'مکمل مسودہ' : 'Complete Manuscript'}
                </span>
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
                <p className="text-[11px] text-stone-400 mt-2">
                  {new Date(item.created_at).toLocaleDateString(
                    language === 'ur' ? 'ur-PK' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </p>
              </div>

              {/* Direct On-Page Document Reader */}
              <div className="my-2">
                <InlinePoetryReader
                  title={displayTitle}
                  documentUrl={fileUrl}
                  isPdf={true}
                  downloadUrl={downloadUrl}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-stone-100 mt-4 flex items-center justify-between text-[11px] text-stone-400">
              <span>{language === 'ur' ? 'قلمی مخطوطہ' : 'Archival PDF'}</span>
              <span className="text-amber-800 font-medium">
                {language === 'ur' ? 'سراج الحق قریشی کا کلام' : 'Siraj ul Haq Qureshi Archive'}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
