'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Lock, X, CheckCircle, Send, Loader2, Clock, AlertCircle } from 'lucide-react';

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle?: string;
  resourceType?: string;
  resourceId?: string;
}

export default function AccessRequestModal({
  isOpen,
  onClose,
  resourceTitle,
  resourceType = 'Archive Item',
  resourceId,
}: AccessRequestModalProps) {
  const { language } = useLanguage();
  const { user, hasAccess, hasPendingRequestFor, refreshAuth } = useAuth();

  const userEmail = user?.email || '';
  const userName = (user?.user_metadata?.full_name as string) || '';

  const [enteredName, setEnteredName] = useState<string | null>(null);
  const [enteredEmail, setEnteredEmail] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const name = enteredName !== null ? enteredName : userName;
  const email = enteredEmail !== null ? enteredEmail : userEmail;

  // Normalize resource category
  const normalizedResourceType = (() => {
    const low = (resourceType || '').toLowerCase();
    if (low.includes('gallery') || low.includes('photo')) return 'gallery';
    if (low.includes('book') || low.includes('publication')) return 'books';
    if (low.includes('poem') || low.includes('ghazal') || low.includes('poetry')) return 'poetry';
    if (low.includes('video')) return 'video';
    return 'all';
  })();

  const isAlreadyPending = hasPendingRequestFor(normalizedResourceType, resourceId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          reason: reason.trim(),
          resource_type: normalizedResourceType,
          resource_id: resourceId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(
            language === 'ur'
              ? 'اس مواد کے لیے آپ کی درخواست پہلے سے زیرِ غور ہے۔ براہ کرم ایڈمنسٹریٹر کے جائزے کا انتظار کریں۔'
              : data.error || 'A request for this resource is already pending review.'
          );
        }
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitted(true);
      await refreshAuth();
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
    setEnteredName(null);
    setEnteredEmail(null);
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
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {hasAccess ? (
          /* User already has access */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {language === 'ur' ? 'آپ کو پہلے ہی رسائی حاصل ہے' : 'Access Already Granted'}
            </h3>
            <p className={`text-sm text-stone-600 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'آپ کا اکاؤنٹ اس نایاب اور محفوظ مواد کو دیکھنے کے لیے پہلے سے منظور شدہ ہے۔'
                : 'Your account is already approved to view and access this restricted collection.'}
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-800 text-white font-medium hover:bg-amber-900 text-sm shadow-md cursor-pointer"
              >
                {language === 'ur' ? 'ٹھیک ہے' : 'Continue'}
              </button>
            </div>
          </div>
        ) : isAlreadyPending ? (
          /* Request already pending */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className={`text-xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {language === 'ur' ? 'درخواست زیرِ غور ہے' : 'Request Pending Review'}
            </h3>
            <p className={`text-sm text-stone-600 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'اس مواد کے لیے آپ کی درخواست پہلے سے جمع ہو چکی ہے اور ایڈمنسٹریٹر کے زیرِ جائزہ ہے۔ منظوری پر آپ کو آگاہ کیا جائے گا۔'
                : 'You have an active request pending review for this resource. The administrator will review your application shortly.'}
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-800 text-white font-medium hover:bg-amber-900 text-sm shadow-md cursor-pointer"
              >
                {language === 'ur' ? 'سمجھ گئے' : 'Understood'}
              </button>
            </div>
          </div>
        ) : submitted ? (
          /* Successfully submitted */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {language === 'ur' ? 'درخواست کامیابی سے موصول ہو گئی' : 'Request Submitted Successfully'}
            </h3>
            <p className={`text-sm text-stone-600 leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'آپ کی رسائی کی درخواست ایڈمنسٹریٹر کو ارسال کر دی گئی ہے۔ منظوری کے بعد مواد آپ کے لیے دستیاب ہو جائے گا۔'
                : 'Your access request has been sent to the archive administrator for review. Once approved, you will have access to the restricted materials.'}
            </p>
            <div className="pt-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-amber-800 text-white font-medium hover:bg-amber-900 text-sm shadow-md cursor-pointer"
              >
                {language === 'ur' ? 'ٹھیک ہے' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          /* Request form */
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
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
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
                  onChange={(e) => setEnteredName(e.target.value)}
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
                  onChange={(e) => setEnteredEmail(e.target.value)}
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
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium cursor-pointer"
                >
                  {language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
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
