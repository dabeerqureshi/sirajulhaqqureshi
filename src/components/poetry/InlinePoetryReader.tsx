'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FileText,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { PoetryVerse } from '@/types/database';

interface InlinePoetryReaderProps {
  title: string;
  documentUrl?: string | null;
  isPdf?: boolean;
  isImage?: boolean;
  verses?: PoetryVerse[];
  downloadUrl?: string | null;
}

type ReaderHeight = 'compact' | 'standard' | 'maximized';

export default function InlinePoetryReader({
  title,
  documentUrl,
  isPdf = false,
  isImage = false,
  verses = [],
  downloadUrl,
}: InlinePoetryReaderProps) {
  const { language } = useLanguage();
  const [readerHeight, setReaderHeight] = useState<ReaderHeight>('standard');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [verseTextSize, setVerseTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasDocument = Boolean(documentUrl && (isPdf || isImage));
  const hasVerses = Boolean(verses && verses.length > 0);

  // Height mappings based on mode
  const getHeightClass = () => {
    switch (readerHeight) {
      case 'compact':
        return 'h-56';
      case 'standard':
        return 'h-96 sm:h-[420px]';
      case 'maximized':
        return 'h-[620px] sm:h-[700px]';
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 75));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const handleToggleMaximize = () => {
    setReaderHeight((prev) => (prev === 'maximized' ? 'standard' : 'maximized'));
  };

  const handleToggleCompact = () => {
    setReaderHeight((prev) => (prev === 'compact' ? 'standard' : 'compact'));
  };

  const handleCopyVerses = () => {
    if (!verses || verses.length === 0) return;
    const text = verses
      .map((v) => [v.ur, v.en ? `(${v.en})` : ''].filter(Boolean).join('\n'))
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Typography scaling for Urdu verses
  const getUrduSizeClass = () => {
    switch (verseTextSize) {
      case 'normal':
        return 'text-lg sm:text-xl leading-loose';
      case 'large':
        return 'text-xl sm:text-2xl leading-[2.6rem]';
      case 'xlarge':
        return 'text-2xl sm:text-3xl leading-[3.2rem]';
    }
  };

  return (
    <div className="space-y-3">
      {/* Interactive Reader Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-stone-100/90 border border-stone-200 rounded-xl text-stone-700">
        <div className="flex items-center gap-2">
          {hasDocument ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-semibold">
              <FileText className="w-3.5 h-3.5 text-amber-800" />
              <span>{isPdf ? 'PDF Manuscript' : 'Archival Scan'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-stone-700" />
              <span>{language === 'ur' ? 'کلام' : 'Verses'}</span>
            </span>
          )}

          <span className="text-[11px] text-stone-500 hidden sm:inline">
            {language === 'ur' ? 'آن لائن مطالعہ' : 'Direct Browser Reading'}
          </span>
        </div>

        {/* Action Controls: Zoom, Minimize/Maximize, Download */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Zoom controls for Image/PDF document */}
          {hasDocument && isImage && (
            <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 75}
                title="Zoom Out"
                className="p-1 hover:bg-stone-100 rounded text-stone-600 disabled:opacity-40"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-medium px-1.5 text-stone-600 min-w-[34px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                title="Zoom In"
                className="p-1 hover:bg-stone-100 rounded text-stone-600 disabled:opacity-40"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoomLevel !== 100 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Font size adjuster for transcribed verses */}
          {hasVerses && !hasDocument && (
            <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs text-xs font-semibold text-stone-600">
              <button
                type="button"
                onClick={() => setVerseTextSize('normal')}
                className={`px-1.5 py-0.5 rounded ${verseTextSize === 'normal' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-stone-100'}`}
                title="Standard Text"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setVerseTextSize('large')}
                className={`px-1.5 py-0.5 rounded ${verseTextSize === 'large' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-stone-100'}`}
                title="Large Text"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setVerseTextSize('xlarge')}
                className={`px-1.5 py-0.5 rounded ${verseTextSize === 'xlarge' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-stone-100'}`}
                title="Extra Large Text"
              >
                A++
              </button>
            </div>
          )}

          {/* Copy Verses button */}
          {hasVerses && (
            <button
              type="button"
              onClick={handleCopyVerses}
              className="p-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-stone-600 hover:text-stone-900 transition-colors shadow-2xs"
              title={language === 'ur' ? 'کلام کاپی کریں' : 'Copy verses to clipboard'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Minimize / Compact Toggle */}
          <button
            type="button"
            onClick={handleToggleCompact}
            className={`p-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-stone-600 hover:text-stone-900 transition-colors shadow-2xs ${
              readerHeight === 'compact' ? 'bg-amber-50 border-amber-300 text-amber-900' : ''
            }`}
            title={readerHeight === 'compact' ? 'Expand to Standard View' : 'Minimize View'}
          >
            {readerHeight === 'compact' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Maximize Toggle */}
          <button
            type="button"
            onClick={handleToggleMaximize}
            className={`p-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-stone-600 hover:text-stone-900 transition-colors shadow-2xs ${
              readerHeight === 'maximized' ? 'bg-amber-800 text-white border-amber-800' : ''
            }`}
            title={readerHeight === 'maximized' ? 'Restore standard view' : 'Maximize reader view'}
          >
            {readerHeight === 'maximized' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Modal Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-stone-600 hover:text-stone-900 transition-colors shadow-2xs hidden sm:inline-flex"
            title={language === 'ur' ? 'مکمل اسکرین' : 'Fullscreen reader'}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Optional Download button */}
          {(downloadUrl || documentUrl) && (
            <a
              href={downloadUrl || documentUrl || '#'}
              download
              className="p-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg transition-colors shadow-2xs"
              title={language === 'ur' ? 'ڈاؤن لوڈ کریں' : 'Download for offline reading'}
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Embedded Document Viewport: PDF / Image / Verses with Scroll & Zoom */}
      <div
        className={`relative w-full rounded-2xl border border-stone-200 bg-stone-900/95 overflow-hidden transition-all duration-300 ${getHeightClass()}`}
      >
        {/* Case 1: PDF Document Reader (embedded directly inside page iframe with smooth scroll) */}
        {hasDocument && isPdf && documentUrl && (
          <iframe
            src={`${documentUrl}#toolbar=0&navpanes=0&view=FitH`}
            title={title}
            className="w-full h-full border-0 bg-white"
            loading="lazy"
          />
        )}

        {/* Case 2: Image Manuscript Reader (scrollable & zoomable) */}
        {hasDocument && isImage && documentUrl && (
          <div className="w-full h-full overflow-auto p-4 flex items-center justify-center bg-stone-950">
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
              }}
              className="flex items-center justify-center min-w-full min-h-full"
            >
              <Image
                src={documentUrl}
                alt={title}
                width={1200}
                height={900}
                unoptimized
                className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
              />
            </div>
          </div>
        )}

        {/* Case 3: Transcribed Verses (displayed in a scrollable, styled reading frame) */}
        {hasVerses && (
          <div className="w-full h-full overflow-y-auto p-5 sm:p-6 bg-stone-50/90 text-stone-900 space-y-4 scrollbar-thin">
            {verses.map((verse, idx) => (
              <div
                key={idx}
                className="bg-white/90 p-4 sm:p-5 rounded-xl border border-stone-200/80 shadow-2xs text-center space-y-3"
              >
                {verse.ur && (
                  <p className={`font-urdu text-stone-900 whitespace-pre-line ${getUrduSizeClass()}`}>
                    {verse.ur}
                  </p>
                )}
                {verse.en && (
                  <p className="text-xs sm:text-sm font-serif italic text-stone-600 border-t border-stone-100 pt-2.5 whitespace-pre-line">
                    &ldquo;{verse.en}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fallback if document missing and verses empty */}
        {!hasDocument && !hasVerses && (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-6 text-center">
            <BookOpen className="w-8 h-8 text-amber-700/60 mb-2" />
            <p className="text-xs font-medium text-stone-300">
              {language === 'ur' ? 'متن یا مسودہ مرتب کیا جا رہا ہے' : 'Manuscript transcription in progress'}
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Reading Mode Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-stone-900 border-b border-stone-800 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold truncate text-amber-100 font-serif">
                {title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(downloadUrl || documentUrl) && (
                <a
                  href={downloadUrl || documentUrl || '#'}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? 'ڈاؤن لوڈ' : 'Download'}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                title="Close Fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen Viewport */}
          <div className="flex-1 w-full h-full overflow-auto bg-stone-950 flex items-center justify-center p-4">
            {hasDocument && isPdf && documentUrl ? (
              <iframe
                src={`${documentUrl}#toolbar=1&navpanes=1&view=FitH`}
                title={title}
                className="w-full h-full border-0 bg-white rounded-xl shadow-2xl"
              />
            ) : hasDocument && isImage && documentUrl ? (
              <div className="max-w-5xl max-h-full overflow-auto flex items-center justify-center p-2">
                <Image
                  src={documentUrl}
                  alt={title}
                  width={1600}
                  height={1200}
                  unoptimized
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
            ) : hasVerses ? (
              <div className="max-w-3xl w-full max-h-[85vh] overflow-y-auto bg-white rounded-2xl p-8 space-y-6 shadow-2xl">
                {verses.map((verse, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-2">
                    {verse.ur && <p className="font-urdu text-2xl text-stone-900 leading-loose">{verse.ur}</p>}
                    {verse.en && <p className="text-sm font-serif italic text-stone-600">&ldquo;{verse.en}&rdquo;</p>}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
