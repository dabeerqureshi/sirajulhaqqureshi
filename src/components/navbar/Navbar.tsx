'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { BookOpen, Feather, Image as ImageIcon, Shield, Menu, X, Globe, UserCheck } from 'lucide-react';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: t('navHome') },
    { href: '/about', label: t('navAbout') },
    { href: '/poetry', label: t('navPoetry') },
    { href: '/books', label: t('navBooks') },
    { href: '/gallery', label: t('navGallery') },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center font-serif text-xl font-bold shadow-md shadow-amber-900/10 group-hover:bg-amber-900 transition-colors">
              {language === 'ur' ? 'س' : 'S'}
            </div>
            <div className="flex flex-col">
              <span className={`text-lg sm:text-xl font-bold tracking-tight text-stone-900 ${language === 'ur' ? 'font-urdu text-xl' : 'font-serif'}`}>
                {t('siteTitle')}
              </span>
              <span className="text-xs text-stone-500 font-medium tracking-wider uppercase">
                {t('siteSubtitle')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-100/70 text-amber-900 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                  } ${language === 'ur' ? 'font-urdu text-base' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 text-xs font-semibold shadow-xs transition-all hover:border-amber-500"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>

            {/* Admin Portal Link */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-medium shadow-xs transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('navAdmin')}</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full border border-stone-300 bg-white text-xs font-semibold text-stone-700"
            >
              {language === 'en' ? 'اردو' : 'EN'}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === link.href
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-stone-700 hover:bg-stone-100'
              } ${language === 'ur' ? 'font-urdu' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-stone-100">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-stone-900 text-stone-100 font-medium text-sm"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>{t('navAdmin')}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
