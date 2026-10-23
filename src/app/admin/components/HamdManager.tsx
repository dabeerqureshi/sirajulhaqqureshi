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
  Pencil,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getHamdItems, hamdDownloadUrl, hamdFileUrl } from '@/lib/data/hamd';
import { useLanguage } from '@/context/LanguageContext';
import type { ContentItem } from '@/types/database';

const MAX_PDF_MB = 50;

interface Props {
  onToast?: (message: string) => void;
}

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

  // Edit State
  const [editingHamd, setEditingHamd] = useState<ContentItem | null>(null);
  const [updatingHamd, setUpdatingHamd] = useState(false);

  const refresh = useCallback(async () => {
    const { items: rows, error } = await getHamdItems();
    setListError(error);
    setItems(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
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
      const urlRes = await fetch('/api/hamd/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: pdfFile.name }),
      });
      const urlJson = await urlRes.json().catch(() => ({}));
      if (!urlRes.ok) {
        throw new Error(urlJson.error || 'Could not prepare the upload.');
      }

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

  const handleSaveEditHamd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingHamd) return;

    setUpdatingHamd(true);
    const form = new FormData(e.currentTarget);
    const updatedTitleEn = (form.get('title_en') as string).trim();
    const updatedTitleUr = (form.get('title_ur') as string).trim();
    const updatedSubEn = (form.get('subtitle_en') as string).trim();
    const updatedSubUr = (form.get('subtitle_ur') as string).trim();

    try {
      const res = await fetch('/api/hamd', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingHamd.id,
          title_en: updatedTitleEn,
          title_ur: updatedTitleUr,
          subtitle_en: updatedSubEn,
          subtitle_ur: updatedSubUr,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Update failed.');

      setItems((prev) =>
        prev.map((item) =>
          item.id === editingHamd.id
            ? {
                ...item,
                title_en: updatedTitleEn,
                title_ur: updatedTitleUr,
                subtitle_en: updatedSubEn,
                subtitle_ur: updatedSubUr,
              }
            : item
        )
      );

      onToast?.('Hamd metadata updated successfully!');
      setEditingHamd(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update Hamd');
    } finally {
      setUpdatingHamd(false);
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
              Subtitle / Context (English)
            </label>
            <input
              type="text"
              value={subtitleEn}
              onChange={(e) => setSubtitleEn(e.target.value)}
              placeholder="e.g. Original handwritten manuscript, 1988"
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
              Subtitle (اردو ذیلی عنوان)
            </label>
            <input
              type="text"
              dir="rtl"
              value={subtitleUr}
              onChange={(e) => setSubtitleUr(e.target.value)}
              placeholder="مثلاً: اصل قلمی نسخہ مع اشعار، ۱۹۸۸ء"
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
            />
          </div>
        </div>

        {/* File picker */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
            Hamd PDF Document (Max {MAX_PDF_MB}MB)
          </label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-700 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-stone-50/60"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <UploadCloud className="w-8 h-8 text-amber-800 mx-auto mb-2" />
            {pdfFile ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-800">
                  {pdfFile.name}
                </p>
                <p className="text-xs text-stone-500">
                  {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-stone-700">
                  Drag & drop your Hamd PDF here, or browse
                </p>
                <p className="text-xs text-stone-400">PDF documents up to 50MB</p>
              </div>
            )}
          </div>
          {fileError && (
            <p className="text-xs text-rose-600 mt-1.5 font-medium">{fileError}</p>
          )}
        </div>

        {submitError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              <span>Uploading to Archive...</span>
            </>
          ) : (
            <span>Publish Hamd PDF</span>
          )}
        </button>
      </form>

      {/* ------------------------- Existing List ------------------------- */}
      <div className="pt-6 border-t border-stone-200 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
            Published Hamd PDFs ({items.length})
          </h4>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold shrink-0"
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
                      onClick={() => setEditingHamd(item)}
                      title="Edit Hamd Details"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
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

      {/* Edit Hamd Modal */}
      {editingHamd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm"
          onClick={() => !updatingHamd && setEditingHamd(null)}
        >
          <div
            className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 font-serif">
                Edit Hamd Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingHamd(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditHamd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Title (English) *
                </label>
                <input
                  name="title_en"
                  type="text"
                  required
                  defaultValue={editingHamd.title_en}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Title (اردو عنوان) *
                </label>
                <input
                  name="title_ur"
                  type="text"
                  dir="rtl"
                  required
                  defaultValue={editingHamd.title_ur}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Subtitle (English)
                </label>
                <input
                  name="subtitle_en"
                  type="text"
                  defaultValue={editingHamd.subtitle_en || ''}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Subtitle (اردو)
                </label>
                <input
                  name="subtitle_ur"
                  type="text"
                  dir="rtl"
                  defaultValue={editingHamd.subtitle_ur || ''}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingHamd(null)}
                  disabled={updatingHamd}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingHamd}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md disabled:opacity-50"
                >
                  {updatingHamd ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
