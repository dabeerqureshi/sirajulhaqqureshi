'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { translateText } from '@/lib/translate';

interface AutoTranslateButtonProps {
  sourceText: string;
  targetLang: 'en' | 'ur';
  onTranslated: (translated: string) => void;
  label?: string;
  className?: string;
}

export default function AutoTranslateButton({
  sourceText,
  targetLang,
  onTranslated,
  label,
  className = '',
}: AutoTranslateButtonProps) {
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clean = sourceText.trim();
    if (!clean) return;

    setTranslating(true);
    try {
      const translated = await translateText(
        clean,
        targetLang,
        targetLang === 'ur' ? 'en' : 'ur'
      );
      if (translated) {
        onTranslated(translated);
      }
    } finally {
      setTranslating(false);
    }
  };

  const defaultLabel =
    targetLang === 'ur'
      ? '✨ اردو ترجمہ کریں'
      : '✨ Translate to English';

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={translating || !sourceText.trim()}
      title={
        !sourceText.trim()
          ? 'Enter text in the other field first to auto-translate'
          : `Automatically translate to ${targetLang === 'ur' ? 'Urdu' : 'English'}`
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
        !sourceText.trim()
          ? 'opacity-40 cursor-not-allowed bg-stone-100 text-stone-400'
          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs hover:shadow-xs active:scale-95'
      } ${className}`}
    >
      {translating ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
          <span>ترجمہ جاری ہے...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 text-amber-700" />
          <span>{label || defaultLabel}</span>
        </>
      )}
    </button>
  );
}
