'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import PoetryCard from '@/components/poetry/PoetryCard';
import HamdSection from '@/components/poetry/HamdSection';
import AccessRequestModal from '@/components/modals/AccessRequestModal';
import { useLanguage } from '@/context/LanguageContext';
import { ContentItem } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { getHamdItems } from '@/lib/data/hamd';
import { Feather, Search, Loader2, RefreshCw } from 'lucide-react';

export default function PoetryPage() {
  const { language, t } = useLanguage();
  const [poetryList, setPoetryList] = useState<ContentItem[]>([]);
  const [hamdCount, setHamdCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedPoetryId, setSelectedPoetryId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  // 'verses' = classic poetry cards, 'hamd' = uploaded Hamd PDF reader section.
  const [section, setSection] = useState<'verses' | 'hamd'>('verses');

  const loadPoetry = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Parallel fetch of poetry items and hamd manuscripts to know counts
      const [poetryRes, hamdRes] = await Promise.all([
        supabase
          .from('content')
          .select('*')
          .eq('type', 'poetry')
          .order('created_at', { ascending: false }),
        getHamdItems(),
      ]);

      if (poetryRes.error) {
        console.error('Failed to load poetry:', poetryRes.error);
        setLoadError(poetryRes.error.message);
      } else if (poetryRes.data) {
        const published = poetryRes.data.filter((p: ContentItem) => p.published !== false);
        setPoetryList(published);

        const hamdTotal = hamdRes.items ? hamdRes.items.length : 0;
        setHamdCount(hamdTotal);

        // Smart default tab:
        // If poetry items exist, show verses; if only Hamd exists, show hamd
        if (published.length > 0) {
          setSection('verses');
        } else if (hamdTotal > 0) {
          setSection('hamd');
        }
      }
    } catch (err) {
      console.error('Error loading poetry archive:', err);
      setLoadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state updates occur after network promises resolve
    loadPoetry();
  }, [loadPoetry]);

  const handleRequestAccess = (title: string, id?: string) => {
    setSelectedTitle(title);
    setSelectedPoetryId(id);
    setModalOpen(true);
  };

  const filteredPoetry = poetryList.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    const matchTitleEn = p.title_en && p.title_en.toLowerCase().includes(q);
    const matchTitleUr = p.title_ur && p.title_ur.includes(searchTerm.trim());

    // Also match inside verses
    let matchVerse = false;
    if (Array.isArray(p.verses)) {
      matchVerse = p.verses.some(
        (v) =>
          (v.ur && v.ur.includes(searchTerm.trim())) ||
          (v.en && v.en.toLowerCase().includes(q))
      );
    }

    return matchTitleEn || matchTitleUr || matchVerse;
  });

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
              <Feather className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ur' ? 'شعری مجموعہ و مخطوطات' : 'Poetic Verses & Manuscripts'}</span>
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
              <div className="relative max-w-md mx-auto pt-2">
                <Search className="w-4 h-4 text-stone-400 absolute left-4 top-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'ur' ? 'نظم، غزل یا شعر تلاش کریں...' : 'Search poem by title or verses...'}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30 shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Section Switcher: Poetic Verses | Hamd Manuscripts */}
          <div className="flex items-center justify-center pt-2 pb-10">
            <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <button
                type="button"
                onClick={() => setSection('verses')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  section === 'verses'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                } ${language === 'ur' ? 'font-urdu' : ''}`}
              >
                <span>{language === 'ur' ? 'غزلیات و کلام' : 'Poetic Verses'}</span>
                {poetryList.length > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      section === 'verses'
                        ? 'bg-amber-900/60 text-amber-200'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {poetryList.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSection('hamd')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  section === 'hamd'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                } ${language === 'ur' ? 'font-urdu' : ''}`}
              >
                <span>{language === 'ur' ? 'حمد و مناجات' : 'Hamd Manuscripts'}</span>
                {typeof hamdCount === 'number' && hamdCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      section === 'hamd'
                        ? 'bg-amber-900/60 text-amber-200'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {hamdCount}
                  </span>
                )}
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
          ) : loadError ? (
            <div className="max-w-xl mx-auto text-center bg-white border border-rose-200 rounded-3xl p-8 space-y-3 shadow-xs">
              <p className="text-sm text-rose-700 font-medium">
                {language === 'ur'
                  ? 'کلام حاصل کرنے میں مسئلہ پیش آ گیا۔'
                  : 'Could not load poetry verses right now.'}
              </p>
              <p className="text-xs text-stone-500 break-all">{loadError}</p>
              <button
                type="button"
                onClick={loadPoetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-amber-300 hover:bg-stone-800 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'ur' ? 'دوبارہ کوشش کریں' : 'Try Again'}</span>
              </button>
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
                  ? 'سراج الحق قریشی کے شعری مسودات کی تدوین کا کام جاری ہے۔ اوپر دیے گئے "حمد و مناجات" ٹیب سے نایاب منظوم حمدیہ کلام کے اصل صفحات کا مطالعہ فرمائیں۔'
                  : 'The poetic verses of Siraj ul Haq Qureshi are currently being cataloged. Please explore the "Hamd Manuscripts" tab to read his original sacred poetry.'}
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
        resourceId={selectedPoetryId}
      />
    </div>
  );
}
