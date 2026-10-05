'use client';

import React, { useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import PoetryCard from '@/components/poetry/PoetryCard';
import AccessRequestModal from '@/components/modals/AccessRequestModal';
import { useLanguage } from '@/context/LanguageContext';
import { mockPoetry } from '@/lib/data/mockData';
import { Feather, Search, Sparkles } from 'lucide-react';

export default function PoetryPage() {
  const { language, t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleRequestAccess = (title: string) => {
    setSelectedTitle(title);
    setModalOpen(true);
  };

  const filteredPoetry = mockPoetry.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.title_en.toLowerCase().includes(q) ||
      p.title_ur.includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
              <Feather className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ur' ? 'شعری مجموعہ' : 'Poetic Verses & Ghazals'}</span>
            </div>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {t('navPoetry')}
            </h1>
            <p className={`text-stone-600 text-sm sm:text-base leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'سراج الحق قریشی کا کلام فکر و فلسفہ، جمالیات اور دلی کیفیات کا نادر مرقع ہے۔ ذیل میں ان کی شائع شدہ اور محفوظ منظومات پیش کی جا رہی ہیں۔'
                : 'A curated anthology of poems, couplets, and philosophical ghazals by Siraj ul Haq Qureshi, presented with side-by-side English translations.'}
            </p>

            {/* Search Input */}
            <div className="relative max-w-md mx-auto pt-4">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-7" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ur' ? 'نظم یا غزل تلاش کریں...' : 'Search poem by title...'}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30 shadow-xs"
              />
            </div>
          </div>

          {/* Poetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPoetry.map((item) => (
              <PoetryCard
                key={item.id}
                poetry={item}
                onRequestAccess={handleRequestAccess}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />

      <AccessRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resourceTitle={selectedTitle}
        resourceType="Poem / Ghazal"
      />
    </div>
  );
}
