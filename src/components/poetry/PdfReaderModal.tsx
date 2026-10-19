'use client';

import React, { useEffect } from 'react';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface PdfReaderModalProps {
  isOpen: boolean;
  /** Fully qualified, browser-readable URL of the PDF. */
  url: string | null;
  title: string;
  /** Optional download URL; falls back to `url` when omitted. */
  downloadUrl?: string | null;
  onClose: () => void;
}

/**
 * Full-screen PDF reader used by the Hamd section of the Poetry page.
 * Renders the document in a native browser PDF viewer (iframe) with a
 * toolbar for downloading, opening in a new tab, and closing.
 */
export default function PdfReaderModal({
  isOpen,
  url,
  title,
  downloadUrl,
  onClose,
}: PdfReaderModalProps) {
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  const href = downloadUrl || url;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Reader Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-stone-800 bg-stone-900/90">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-stone-100 truncate">
            {title}
          </span>
          <span className="hidden sm:inline text-[11px] text-stone-400 border border-stone-700 rounded px-1.5 py-0.5">
            PDF
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{language === 'ur' ? 'نئے ٹیب میں' : 'New Tab'}</span>
          </a>
          <a
            href={href}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('downloadPdf')}</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'ur' ? 'ریڈر بند کریں' : 'Close reader'}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Embedded PDF Document */}
      <div className="flex-1 min-h-0 bg-stone-900">
        <iframe
          src={url}
          title={title}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
