'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PdfReaderModal from '@/components/poetry/PdfReaderModal';
import {
  BookOpen,
  Download,
  FileText,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getHamdItems, hamdDownloadUrl, hamdFileUrl } from '@/lib/data/hamd';
import { useLanguage } from '@/context/LanguageContext';
import type { ContentItem } from '@/types/database';

const MAX_PDF_MB = 50;

interface Props {
  onToast?: (message: string) => void;
}

/**
 * Admin tab for managing Hamd poetry PDFs. Upload flow: signed upload URL
 * (admin API) -> direct browser upload to Supabase Storage -> metadata row in
 * the `content` table (type 'hamd'). The signed-URL hop keeps large PDFs out
 * of Vercel's serverless request body limit.
 */
export default function HamdManager({ onToast }: Props) {
  const { language } = useLanguage();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [titleEn, setTitleEn] = useState('');
  const [titleUr, setTitleUr] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [subtitleUr, setSubtitleUr] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reading, setReading] = useState<ContentItem | null>(null);

  const refresh = useCallback(async () => {
    // State updates happen only after the network call resolves, so the effect
    // body never sets state synchronously.
    const { items: rows, error } = await getHamdItems();
    setListError(error);
    setItems(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- getHamdItems() is a network call; every setState in `refresh` runs only after its promise resolves, so there is no cascading synchronous render
    refresh();
  }, [refresh]);

  const pickFile = (file: File | null | undefined) => {
    setFileError(null);
    if (!file) {
      setPdfFile(null);
      return;
    }
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileError('Only PDF files are allowed.');
      return;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      setFileError(`PDF exceeds the ${MAX_PDF_MB}MB limit.`);
      return;
    }
    setPdfFile(file);
  };

  const clearFile = () => {
    setPdfFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!titleEn.trim() || !titleUr.trim()) {
      setSubmitError('Both English and Urdu titles are required.');
      return;
    }
    if (!pdfFile) {
      setFileError('Choose the Hamd PDF you want to publish.');
      return;
    }

    setSubmitting(true);
    try {
      // 1) Ask the admin API for a one-time signed upload URL.
      const urlRes = await fetch('/api/hamd/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: pdfFile.name }),
      });
      const urlJson = await urlRes.json().catch(() => ({}));
      if (!urlRes.ok) {
        throw new Error(urlJson.error || 'Could not prepare the upload.');
      }

      // 2) Upload straight to Supabase Storage from the browser.
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Supabase is not configured on this deployment.');
      }
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .uploadToSignedUrl(urlJson.path, urlJson.token, pdfFile, {
          contentType: 'application/pdf',
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      // 3) Persist the metadata row.
      const saveRes = await fetch('/api/hamd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: urlJson.path,
          title_en: titleEn.trim(),
          title_ur: titleUr.trim(),
          subtitle_en: subtitleEn.trim(),
          subtitle_ur: subtitleUr.trim(),
        }),
      });
      const saveJson = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) {
        throw new Error(saveJson.error || 'Could not save the Hamd record.');
      }

      setTitleEn('');
      setTitleUr('');
      setSubtitleEn('');
      setSubtitleUr('');
      clearFile();
      onToast?.('Hamd PDF published — now readable in the Poetry ▸ Hamd section.');
      refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ContentItem) => {
    const confirmed = window.confirm(
      language === 'ur'
        ? `کیا آپ "${item.title_ur}" اور اس کا پی ڈی ایف حذف کرنا چاہتے ہیں؟`
        : `Delete "${item.title_en}" and its PDF? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/hamd', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Delete failed.');
      onToast?.('Hamd PDF removed from the archive.');
      refresh();
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const readerUrl = reading ? hamdFileUrl(reading.file_path) : null;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* ------------------------- Upload form ------------------------- */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900 font-serif">
            Publish a Hamd PDF / حمد شائع کریں
          </h3>
          <p className="text-xs text-stone-500">
            Upload a Hamd poetry PDF — visitors will read it directly inside the
            Poetry ▸ Hamd section without leaving the website.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
              Hamd Title (English)
            </label>
            <input
              type="text"
              required
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Hamd — The Divine Praise"
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
              Hamd Title (اردو عنوان)
            </label>
            <input
              type="text"
              dir="rtl"
              required
              value={titleUr}
              onChange={(e) => setTitleUr(e.target.value)}
              placeholder="مثلاً: حمدِ خالق"
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
              Subtitle (English, optional)
            </label>
            <input
              type="text"
              value={subtitleEn}
              onChange={(e) => setSubtitleEn(e.target.value)}
              placeholder="Short description or collection name"
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
              Subtitle (اردو، اختیاری)
            </label>
            <input
              type="text"
              dir="rtl"
              value={subtitleUr}
              onChange={(e) => setSubtitleUr(e.target.value)}
              placeholder="مختصر تعریف یا مجموعے کا نام"
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
            />
          </div>
        </div>

        {/* PDF picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Hamd PDF Document
            </label>
            <span className="text-[11px] text-stone-400 font-medium">
              Allowed: PDF (Max {MAX_PDF_MB}MB)
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          {pdfFile ? (
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">
                    {pdfFile.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {(pdfFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer border-stone-300 bg-stone-50/50 hover:bg-stone-50 hover:border-amber-600 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6 text-amber-800" />
              </div>
              <p className="text-sm font-semibold text-stone-800">
                Click to upload or drag &amp; drop
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Accepts PDF documents (up to {MAX_PDF_MB}MB)
              </p>
            </div>
          )}

          {fileError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {fileError}
            </div>
          )}
        </div>

        {submitError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:bg-amber-300 text-white text-sm font-semibold shadow-md transition-colors"
        >
          {submitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          <span>
            {submitting ? 'Publishing…' : 'Publish Hamd PDF to Poetry Section'}
          </span>
        </button>
      </form>

      {/* --------------------- Published Hamd list --------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              Published Hamd PDFs
            </h3>
            <p className="text-xs text-stone-500">
              These PDFs appear in the public Poetry ▸ Hamd section where every
              visitor can read them online.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              refresh();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {listError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {listError}
          </div>
        )}

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-stone-100 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
            No Hamd PDFs published yet — upload the first one using the form
            above.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 border border-stone-200 rounded-xl">
            {items.map((item) => {
              const downloadUrl = hamdDownloadUrl(item.file_path);
              return (
                <li
                  key={item.id}
                  className="p-4 flex flex-wrap items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {language === 'ur' ? item.title_ur : item.title_en}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setReading(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-amber-300 hover:bg-stone-800 text-xs font-semibold transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Read
                    </button>
                    <a
                      href={downloadUrl || '#'}
                      download
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 text-white hover:bg-amber-900 text-xs font-medium transition-colors ${
                        downloadUrl ? '' : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="Delete Hamd PDF"
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Inline reader for previewing published Hamd PDFs */}
      <PdfReaderModal
        isOpen={reading !== null && readerUrl !== null}
        url={readerUrl}
        downloadUrl={reading ? hamdDownloadUrl(reading.file_path) : null}
        title={
          reading
            ? language === 'ur'
              ? reading.title_ur
              : reading.title_en
            : ''
        }
        onClose={() => setReading(null)}
      />
    </div>
  );
}
