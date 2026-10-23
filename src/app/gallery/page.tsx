'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import AccessRequestModal from '@/components/modals/AccessRequestModal';
import { useLanguage } from '@/context/LanguageContext';
import { mockGallery } from '@/lib/data/mockData';
import { GalleryItem } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Image as ImageIcon } from 'lucide-react';

export default function GalleryPage() {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<GalleryItem[]>(mockGallery);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhotoTitle, setSelectedPhotoTitle] = useState('');

  useEffect(() => {
    const loadGallery = async () => {
      const supabase = createClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setItems(data);
      }
    };

    loadGallery();
  }, []);

  const handleRequestAccess = (title: string) => {
    setSelectedPhotoTitle(title);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
              <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ur' ? 'تصویری دستاویزات اور یادگار لمحات' : 'Visual Archives & Memorabilia'}</span>
            </div>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {t('navGallery')}
            </h1>
            <p className={`text-stone-600 text-sm sm:text-base leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'مشاعروں، علمی مجالس، خاندانی تقریبات اور نایاب مسودات کی یادگار تصاویر۔'
                : 'A visual documentation of historic mushairas, intellectual gatherings, and personal archives.'}
            </p>
          </div>

          {/* Gallery with category filter and restricted handling */}
          <GalleryGrid
            items={items}
            onRequestAccess={handleRequestAccess}
          />
        </div>
      </main>

      <Footer />

      <AccessRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resourceTitle={selectedPhotoTitle}
        resourceType="Archival Photograph"
      />
    </div>
  );
}
