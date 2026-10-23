'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Lock, X, CheckCircle, Send, Loader2 } from 'lucide-react';

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle?: string;
  resourceType?: string;
}

export default function AccessRequestModal({
  isOpen,
  onClose,
  resourceTitle,
  resourceType = 'Archive Item'
}: AccessRequestModalProps) {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      let rType = 'all';
      const low = (resourceType || '').toLowerCase();
      if (low.includes('gallery') || low.includes('photo')) rType = 'gallery';
      else if (low.includes('book') || low.includes('publication')) rType = 'books';
      else if (low.includes('poem') || low.includes('ghazal') || low.includes('poetry')) rType = 'poetry';
      else if (low.includes('video')) rType = 'video';

      const res = await fetch('/api/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          reason: reason.trim(),
          resource_type: rType,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : language === 'ur'
          ? 'درخواست جمع کرنے میں خرابی پیش آئی'
          : 'Failed to submit request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setName('');
    setEmail('');
    setReason('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {language === 'ur' ? 'درخواست کامیابی سے موصول ہو گئی' : 'Request Submitted Successfully'}
            </h3>
            <p className={`text-sm text-stone-600 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'آپ کی رسائی کی درخواست ایڈمنسٹریٹر کو ارسال کر دی گئی ہے۔ منظوری کے بعد آپ کے ای میل پر تصدیق بھیجی جائے گی۔'
                : 'Your access request has been sent to the archive administrator for review. Once approved, you will have access to the restricted materials.'}
            </p>
            <div className="pt-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-amber-800 text-white font-medium hover:bg-amber-900 text-sm shadow-md"
              >
                {language === 'ur' ? 'ٹھیک ہے' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-lg font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                  {language === 'ur' ? 'محفوظ مواد تک رسائی کی درخواست' : 'Request Access to Restricted Content'}
                </h3>
                <p className="text-xs text-stone-500">
                  {resourceTitle ? `${resourceType}: ${resourceTitle}` : 'Archival Collection'}
                </p>
              </div>
            </div>

            <p className={`text-xs text-stone-600 mb-6 bg-stone-50 p-3 rounded-xl border border-stone-200 ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'یہ دستاویز یا تصویر نجی یا تحقیقی نگہداشت میں ہے۔ براہ کرم اپنا تعارف اور ضرورت درج کریں تاکہ ایڈمن رسائی منظور کر سکے۔'
                : 'This item is part of the restricted historical or family collection. Please provide your details and rationale for access.'}
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {language === 'ur' ? 'آپ کا مکمل نام' : 'Your Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ur' ? 'مثلاً: محمد احمد' : 'e.g. Dr. Sarah Jenkins'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {language === 'ur' ? 'ای میل ایڈریس' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {language === 'ur' ? 'رسائی کی وجہ یا تحقیقی مقصد' : 'Purpose of Access / Affiliation'} *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    language === 'ur'
                      ? 'مثلاً: پی ایچ ڈی مقالے کے لیے نایاب خطوط کا مطالعہ درکار ہے...'
                      : 'e.g. Academic research on classical South Asian literature, family member, etc.'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium"
                >
                  {language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{language === 'ur' ? 'درخواست بھیجیں' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
