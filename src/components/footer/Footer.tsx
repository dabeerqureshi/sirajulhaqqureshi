'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Feather, Heart } from 'lucide-react';

export default function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Legacy Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Feather className="w-5 h-5 text-amber-400" />
              <h3 className={`text-xl font-bold text-white ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                {t('siteTitle')}
              </h3>
            </div>
            <p className={`text-sm text-stone-400 leading-relaxed max-w-md ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'علم و ادب، فکری بصیرت اور شعری نغمگی کا نایاب امتزاج۔ یہ ڈیجیٹل کتب خانہ اور آرکائیو نئی نسل کے لیے ایک مشعلِ راہ ہے۔'
                : 'Preserving the literary creations, philosophical essays, and poetic brilliance of Siraj ul Haq Qureshi for future generations of scholars and poetry enthusiasts.'}
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
              {language === 'ur' ? 'روابط' : 'Navigation'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-amber-400 transition-colors">
                  {t('navAbout')}
                </Link>
              </li>
              <li>
                <Link href="/poetry" className="hover:text-amber-400 transition-colors">
                  {t('navPoetry')}
                </Link>
              </li>
              <li>
                <Link href="/books" className="hover:text-amber-400 transition-colors">
                  {t('navBooks')}
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-amber-400 transition-colors">
                  {t('navGallery')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Archival Access Notice */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
              {language === 'ur' ? 'محفوظ آرکائیو' : 'Archival Access'}
            </h4>
            <p className={`text-xs text-stone-400 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'نایاب اور غیر مطبوعہ کتب و تصاویر تک رسائی کے لیے ایڈمن سے باضابطہ تصدیق درکار ہے۔'
                : 'Restricted historical materials and private manuscripts are guarded with Supabase RLS and temporary signed tokens.'}
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-block text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4"
              >
                {t('navAdmin')} &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-stone-800 text-center text-xs text-stone-500">
          <p>{t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}
