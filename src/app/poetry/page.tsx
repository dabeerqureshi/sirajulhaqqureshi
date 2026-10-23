'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import PoetryCard from '@/components/poetry/PoetryCard';
import HamdSection from '@/components/poetry/HamdSection';
import AccessRequestModal from '@/components/modals/AccessRequestModal';
import { useLanguage } from '@/context/LanguageContext';
import { ContentItem } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Feather, Search, Loader2 } from 'lucide-react';

export default function PoetryPage() {
  const { language, t } = useLanguage();
  const [poetryList, setPoetryList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // 'verses' = classic poetry cards, 'hamd' = uploaded Hamd PDF reader section.
  const [section, setSection] = useState<'verses' | 'hamd'>('hamd');

  useEffect(() => {
    const loadPoetry = async () => {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'poetry')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const published = data.filter((p: ContentItem) => p.published);
        setPoetryList(published);
        // If poetry items exist, default to verses tab; otherwise stay on Hamd
        if (published.length > 0) {
          setSection('verses');
        }
      }
      setLoading(false);
    };

    loadPoetry();
  }, []);

  const handleRequestAccess = (title: string) => {
    setSelectedTitle(title);
    setModalOpen(true);
  };

  const filteredPoetry = poetryList.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      (p.title_en && p.title_en.toLowerCase().includes(q)) ||
      (p.title_ur && p.title_ur.includes(searchTerm))
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
                ? 'سراج الحق قریشی کا کلام فکر و فلسفہ، جمالیات اور دلی کیفیات کا نادر مرقع ہے۔'
                : 'A curated anthology of poems, couplets, and philosophical ghazals by Siraj ul Haq Qureshi.'}
            </p>

            {section === 'verses' && poetryList.length > 0 && (
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
            )}
          </div>

          {/* Section Switcher: Poetry Verses | Hamd */}
          <div className="flex items-center justify-center pt-2 pb-10">
            <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <button
                type="button"
                onClick={() => setSection('hamd')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  section === 'hamd'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                } ${language === 'ur' ? 'font-urdu' : ''}`}
              >
                {language === 'ur' ? 'حمد و مناجات' : 'Hamd Manuscripts'}
              </button>
              <button
                type="button"
                onClick={() => setSection('verses')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  section === 'verses'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                } ${language === 'ur' ? 'font-urdu' : ''}`}
              >
                {language === 'ur' ? 'غزلیات و کلام' : 'Poetic Verses'}
              </button>
            </div>
          </div>

          {/* Content display */}
          {section === 'hamd' ? (
            /* Hamd Section — PDFs uploaded from the admin portal */
            <HamdSection />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-700 mb-3" />
              <p className="text-sm">{language === 'ur' ? 'کلام لوڈ ہو رہا ہے...' : 'Loading poetry archive...'}</p>
            </div>
          ) : filteredPoetry.length > 0 ? (
            /* Poetry Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPoetry.map((item) => (
                <PoetryCard
                  key={item.id}
                  poetry={item}
                  onRequestAccess={handleRequestAccess}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="max-w-xl mx-auto text-center py-16 px-6 bg-white rounded-3xl border border-stone-200/80 shadow-xs">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                <Feather className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-bold text-stone-800 mb-2 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                {language === 'ur' ? 'منظوم کلام مرتب کیا جا رہا ہے' : 'Poetic Verses In Preparation'}
              </h3>
              <p className={`text-stone-600 text-sm leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
                {language === 'ur'
                  ? 'سراج الحق قریشی کے شعری مسودات کی تدوین کا کام جاری ہے۔ تب تک اوپر دیے گئے "حمد و مناجات" ٹیب سے نایاب منظوم حمدیہ کلام کے اصل صفحات کا مطالعہ فرمائیں۔'
                  : 'The poetic verses of Siraj ul Haq Qureshi are currently being compiled and cataloged. Please explore the verified "Hamd Manuscripts" tab to read his original sacred poetry.'}
              </p>
            </div>
          )}
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
