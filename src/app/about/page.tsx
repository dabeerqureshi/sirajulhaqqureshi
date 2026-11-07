'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { mockBiography } from '@/lib/data/mockData';
import { createClient } from '@/lib/supabase/client';
import { getStorageUrl } from '@/lib/supabase/storage';

export default function AboutPage() {
  const { language } = useLanguage();
  const [bio, setBio] = useState(mockBiography);

  useEffect(() => {
    const loadBio = async () => {
      const supabase = createClient();
      if (!supabase) return;

      const { data } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'biography')
        .maybeSingle();

      if (data) {
        setBio({
          ...mockBiography,
          ...data,
          title_en: data.title_en || mockBiography.title_en,
          title_ur: data.title_ur || mockBiography.title_ur,
          subtitle_en: data.subtitle_en || mockBiography.subtitle_en,
          subtitle_ur: data.subtitle_ur || mockBiography.subtitle_ur,
          body_en: data.body_en || mockBiography.body_en,
          body_ur: data.body_ur || mockBiography.body_ur,
          cover_image: data.cover_image ? getStorageUrl(data.cover_image) : mockBiography.cover_image,
        });
      }
    };

    loadBio();
  }, []);

  const milestones = [
    {
      year: '1952',
      title_en: 'First Literary Publication',
      title_ur: 'پہلی ادبی اشاعت',
      desc_en: 'Authored early critical essays and ghazals published in renowned literary journals across the region.',
      desc_ur: 'معروف ادبی رسائل و جرائد میں ابتدائی تنقیدی مضامین اور غزلیات کی اشاعت۔'
    },
    {
      year: '1968',
      title_en: 'Philosophical Dialogues',
      title_ur: 'فلسفیانہ مکالمے اور کانفرنسز',
      desc_en: 'Represented classical Urdu literature at international conferences, presenting theses on ethics and spiritual elevation.',
      desc_ur: 'بین الاقوامی ادبی کانفرنسوں میں اردو ادب اور اخلاقی فلسفے پر تاریخی مقالات کی پیشکش۔'
    },
    {
      year: '1985',
      title_en: 'Presiding Over Historic Mushaira',
      title_ur: 'تاریخی مشاعرے کی صدارت',
      desc_en: 'Honored with the presidency of national literary gatherings alongside the foremost poets of the era.',
      desc_ur: 'عہد کے سرکردہ شعرا اور دانشوروں کے ہمراہ قومی ادبی تقریب اور مشاعرے کی صدارت کا اعزاز۔'
    },
    {
      year: '1998',
      title_en: 'Publication of Kulliyat-e-Siraj',
      title_ur: 'کلیاتِ سراج کی باوقار اشاعت',
      desc_en: 'Comprehensive compendium containing all poetic works, reflective poems, and philosophical ghazals.',
      desc_ur: 'تمام شعری سرمائے، منظومات اور فکری غزلیات پر مشتمل جامع کلیات کا اجرا۔'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-xs uppercase tracking-widest text-amber-800 font-bold">
              {language === 'ur' ? 'سوانحِ حیات و فکری سفر' : 'Biography & Intellectual Legacy'}
            </span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {language === 'ur' ? bio.title_ur : bio.title_en}
            </h1>
            <p className={`text-base sm:text-lg text-stone-600 max-w-2xl mx-auto ${language === 'ur' ? 'font-urdu' : 'font-serif italic'}`}>
              {language === 'ur' ? bio.subtitle_ur : bio.subtitle_en}
            </p>
          </div>

          {/* Portrait Banner */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-800 bg-stone-950 flex items-center justify-center p-3 h-80 sm:h-96">
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-md opacity-35 scale-125"
              style={{ backgroundImage: `url(${bio.cover_image || ''})` }}
            />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <Image
                src={bio.cover_image || '/gallery/siraj-profile.jpg'}
                alt="Siraj ul Haq Qureshi Archives"
                width={600}
                height={400}
                priority
                className="max-h-full max-w-full object-contain rounded-xl shadow-md"
                unoptimized={!!bio.cover_image?.startsWith('data:')}
              />
            </div>
          </div>

          {/* In-depth Narrative */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-sm space-y-6">
            <h2 className={`text-2xl font-bold text-stone-900 border-b border-stone-100 pb-4 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {language === 'ur' ? 'علمی و ادبی خدمات کا جائزہ' : 'Overview of Contributions'}
            </h2>

            <div className={`prose prose-stone max-w-none text-stone-700 leading-relaxed space-y-4 text-base sm:text-lg ${language === 'ur' ? 'font-urdu' : ''}`}>
              <p>
                {language === 'ur'
                  ? (bio.body_ur || mockBiography.body_ur)
                  : (bio.body_en || mockBiography.body_en)}
              </p>
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className={`text-2xl sm:text-3xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                {language === 'ur' ? 'اہم تاریخی سنگِ میل' : 'Chronological Milestones'}
              </h2>
            </div>

            <div className="relative border-l-2 border-amber-300 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-8">
              {milestones.map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-amber-800 border-4 border-white shadow-xs"></div>
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      {item.year}
                    </span>
                    <h3 className={`text-lg font-bold text-stone-900 mt-2 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                      {language === 'ur' ? item.title_ur : item.title_en}
                    </h3>
                    <p className={`text-sm text-stone-600 mt-1 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
                      {language === 'ur' ? item.desc_ur : item.desc_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
