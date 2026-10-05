'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

interface Translations {
  [key: string]: {
    en: string;
    ur: string;
  };
}

export const translations: Translations = {
  siteTitle: {
    en: 'Siraj ul Haq Qureshi',
    ur: 'سراج الحق قریشی'
  },
  siteSubtitle: {
    en: 'Digital Archive & Literary Portfolio',
    ur: 'ڈیجیٹل آرکائیو اور ادبی ورثہ'
  },
  navHome: {
    en: 'Home',
    ur: 'صفحۂ اول'
  },
  navAbout: {
    en: 'Biography',
    ur: 'سوانحِ حیات'
  },
  navPoetry: {
    en: 'Poetry',
    ur: 'شاعری'
  },
  navBooks: {
    en: 'Books & Publications',
    ur: 'کتب و تصانیف'
  },
  navGallery: {
    en: 'Gallery',
    ur: 'تصویری البم'
  },
  navAdmin: {
    en: 'Admin Portal',
    ur: 'ایڈمن پورٹل'
  },
  requestAccess: {
    en: 'Request Access',
    ur: 'رسائی کی درخواست کریں'
  },
  restrictedBadge: {
    en: 'Restricted Access',
    ur: 'مخصوص رسائی'
  },
  publicBadge: {
    en: 'Public',
    ur: 'عام'
  },
  readOnline: {
    en: 'Read Online',
    ur: 'آن لائن پڑھیں'
  },
  downloadPdf: {
    en: 'Download PDF',
    ur: 'پی ڈی ایف ڈاؤن لوڈ'
  },
  lockedContentNotice: {
    en: 'This archival material is restricted to authorized family members and verified researchers.',
    ur: 'یہ تاریخی دستاویز صرف مجاز خاندانی افراد اور تصدیق شدہ محققین کے لیے دستیاب ہے۔'
  },
  viewAll: {
    en: 'View All',
    ur: 'تمام دیکھیں'
  },
  featuredWorks: {
    en: 'Featured Works',
    ur: 'نمایاں تصانیف'
  },
  recentPoetry: {
    en: 'Timeless Poetry',
    ur: 'منتخب کلام'
  },
  photoArchives: {
    en: 'Historical Archives',
    ur: 'تاریخی تصاویر'
  },
  allRightsReserved: {
    en: 'All rights reserved. Dedicated to the literary legacy of Siraj ul Haq Qureshi.',
    ur: 'جملہ حقوق محفوظ ہیں۔ سراج الحق قریشی کے ادبی اور فکری ورثے کے نام۔'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('site_language') as Language;
    if (saved === 'en' || saved === 'ur') {
      setLanguageState(saved);
      document.documentElement.dir = saved === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = saved;
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('site_language', lang);
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const dir = language === 'ur' ? 'rtl' : 'ltr';

  const t = (key: keyof typeof translations): string => {
    const item = translations[key];
    if (!item) return String(key);
    return item[language] || item['en'] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      <div dir={dir} className={language === 'ur' ? 'font-urdu' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
