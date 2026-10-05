'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Lock, X, CheckCircle, Send } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate request submission to Supabase
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setSubmitted(false);
    setName('');
    setEmail('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
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
              {language === 'ur' ? 'درخواست کامیابی سے ارسال کر دی گئی ہے' : 'Request Submitted Successfully'}
            </h3>
            <p className={`text-sm text-stone-600 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'آپ کی رسائی کی درخواست ایڈمن کو موصول ہو چکی ہے۔ جانچ پڑتال کے بعد آپ کو بذریعہ ای میل مطلع کیا جائے گا۔'
                : 'Your access request has been forwarded to the archive administrator. You will receive an email once approved.'}
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

            <p className={`text-xs text-stone-600 mb-6 bg-stone-50 p-3 rounded-lg border border-stone-200 ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'یہ دستاویز یا تصویر خصوصی نگہداشت میں ہے۔ براہ کرم اپنا تعارف اور ضرورت درج کریں تاکہ ایڈمن رسائی منظور کر سکے۔'
                : 'This archival material is restricted. Please provide your information and scholarly or personal reason for requesting access.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  {language === 'ur' ? 'پورا نام' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ur' ? 'مثلاً محمد علی' : 'e.g. Muhammad Ali'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  {language === 'ur' ? 'ای میل ایڈریس' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  {language === 'ur' ? 'رسائی کی وجہ / تعلق' : 'Reason for Access / Affiliation'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={language === 'ur' ? 'تحقیقی مقصد، خاندانی تعلق یا ذاتی مطالعہ...' : 'Research inquiry, family affiliation, or academic study...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-medium"
                >
                  {language === 'ur' ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-800 text-white hover:bg-amber-900 text-sm font-medium shadow-md transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? (language === 'ur' ? 'ارسال ہو رہا ہے...' : 'Submitting...') : (language === 'ur' ? 'درخواست بھیجیں' : 'Submit Request')}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
