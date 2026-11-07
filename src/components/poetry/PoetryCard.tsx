'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ContentItem, PoetryVerse } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';
import {
  Lock,
  Feather,
  Sparkles,
  BookOpen,
  Download,
  FileText,
  Maximize2,
  X,
  Calendar,
} from 'lucide-react';
import PdfReaderModal from '@/components/poetry/PdfReaderModal';

interface PoetryCardProps {
  poetry: ContentItem;
  onRequestAccess?: (title: string) => void;
}

/**
 * Resolve a stored media path (or URL / data URL) to a browser-usable URL.
 */
function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.replace(/^\/+/, '');
  const within = clean.startsWith('public-assets/')
    ? clean.slice('public-assets/'.length)
    : clean;

  return `${base.replace(/\/+$/, '')}/storage/v1/object/public/public-assets/${within}`;
}

export default function PoetryCard({ poetry, onRequestAccess }: PoetryCardProps) {
  const { language } = useLanguage();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const isRestricted = poetry.visibility === 'restricted';
  const mediaPath = poetry.cover_image || poetry.file_path || null;
  const resolvedUrl = resolveMediaUrl(mediaPath);

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
          <div className="space-y-4 my-3">
            {/* Attached Manuscript Artwork/Image if present */}
            {isImage && resolvedUrl && (
              <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-100 max-h-56 flex items-center justify-center">
                <Image
                  src={resolvedUrl}
                  alt={displayTitle}
                  width={500}
                  height={300}
                  className="max-h-56 w-full object-contain transition-transform duration-300 group-hover:scale-102"
                  unoptimized={resolvedUrl.startsWith('data:')}
                />
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>{language === 'ur' ? 'مکمل مسودہ دیکھیں' : 'View Full Manuscript'}</span>
                </button>
              </div>
            )}

            {/* Attached Manuscript PDF Banner if present */}
            {isPdf && resolvedUrl && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">
                      {language === 'ur' ? 'اصل قلمی مسودہ (PDF)' : 'Handwritten Manuscript (PDF)'}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {language === 'ur' ? 'آن لائن مطالعہ کے لیے دستیاب' : 'Preserved archival document'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPdfModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-medium transition-colors shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{language === 'ur' ? 'مطالعہ' : 'Read'}</span>
                  </button>
                  <a
                    href={resolvedUrl}
                    download
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors"
                    title={language === 'ur' ? 'ڈاؤن لوڈ' : 'Download'}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Verses / Couplets */}
            {validVerses.length > 0 ? (
              <div className="space-y-4">
                {validVerses.map((verse, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-50/70 p-4 rounded-xl border border-stone-100 text-center"
                  >
                    {/* Urdu verse (Nastaliq centered) */}
                    {verse.ur && (
                      <p className="font-urdu text-xl sm:text-2xl text-stone-900 leading-loose whitespace-pre-line py-1">
                        {verse.ur}
                      </p>
                    )}
                    {/* English poetic translation */}
                    {verse.en && (
                      <p className="text-xs sm:text-sm font-serif italic text-stone-600 border-t border-stone-200/60 pt-2.5 mt-2 whitespace-pre-line">
                        &ldquo;{verse.en}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : !isImage && !isPdf ? (
              <div className="bg-stone-50/60 p-4 rounded-xl border border-dashed border-stone-200 text-center text-xs text-stone-500">
                {language === 'ur' ? 'متن جلد شامل کیا جائے گا' : 'Text transcription in compilation'}
              </div>
            ) : null}
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

        {isImage && resolvedUrl && (
          <button
            type="button"
            onClick={() => setIsImageModalOpen(true)}
            className="text-amber-800 hover:text-amber-900 font-medium inline-flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" />
            <span>{language === 'ur' ? 'مسودہ' : 'View Manuscript'}</span>
          </button>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {isPdf && resolvedUrl && (
        <PdfReaderModal
          isOpen={isPdfModalOpen}
          url={resolvedUrl}
          title={displayTitle}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}

      {/* Image Manuscript Preview Modal */}
      {isImage && resolvedUrl && isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-2xl overflow-hidden border border-stone-700 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-950 text-white">
              <span className="text-sm font-semibold truncate">{displayTitle}</span>
              <div className="flex items-center gap-2">
                <a
                  href={resolvedUrl}
                  download
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center">
              <Image
                src={resolvedUrl}
                alt={displayTitle}
                width={1200}
                height={900}
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-lg"
                unoptimized={resolvedUrl.startsWith('data:')}
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
