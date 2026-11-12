'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Maximize2, Minimize2, X } from 'lucide-react';
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
 * Full-screen in-website PDF reader used by the Hamd & Poetry archive.
 * Renders the document directly inside the website viewport with no
 * redirection to external PDF reader applications or new tabs.
 */
export default function PdfReaderModal({
  isOpen,
  url,
  title,
  onClose,
}: PdfReaderModalProps) {
  const { language } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-sm ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-stone-800 bg-stone-900 shadow-2xl">
        {/* Reader Toolbar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-900/50 text-amber-300 flex items-center justify-center shrink-0 border border-amber-800/60">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-stone-100 truncate block">
                {title}
              </span>
              <span className="text-[11px] text-amber-400 font-medium">
                {language === 'ur' ? 'آن لائن ریڈر (ڈیجیٹل دستاویز)' : 'In-App Archival Document Viewer'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
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

        {/* Embedded PDF Document — renders inside website */}
        <div className="flex-1 min-h-0 bg-stone-950 relative">
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
            title={title}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
