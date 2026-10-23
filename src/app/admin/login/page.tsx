'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function AdminLoginPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      setError(
        language === 'ur'
          ? 'سپرابیس کنفیگر نہیں کیا گیا۔ NEXT_PUBLIC_SUPABASE متغیرات چیک کریں۔'
          : 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and API keys.'
      );
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    // Check if the user has admin role via profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    setLoading(false);

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError(
        language === 'ur'
          ? 'فقط ایڈمن لاگ ان کر سکتا ہے۔ اس اکاؤنٹ کے پاس ایڈمن کے اختیارات نہیں ہیں۔'
          : 'Access denied: your account is not authorized as an administrator.'
      );
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 px-4 py-12">
      {/* Return to website */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-amber-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'ur' ? 'مرکزی ویب سائٹ پر واپس جائیں' : 'Back to Digital Archive'}</span>
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200/80 shadow-xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-800 text-amber-100 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-900/20">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className={`text-2xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
            {language === 'ur' ? 'ایڈمن کنٹرول پینل' : 'Administrator Portal'}
          </h2>
          <p className={`text-stone-500 text-xs mt-1.5 ${language === 'ur' ? 'font-urdu' : ''}`}>
            {language === 'ur'
              ? 'محفوظ کتب، اشعار، ویڈیوز اور منظوریوں کا انتظام کریں۔'
              : 'Sign in to manage books, manuscripts, videos, and access requests.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1.5">
              {language === 'ur' ? 'ای میل ایڈریس' : 'Admin Email'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sirajulhaqqureshi.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1.5">
              {language === 'ur' ? 'پاسورڈ' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white text-sm font-semibold shadow-md transition-colors mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === 'ur' ? 'تصدیق جاری ہے...' : 'Authenticating...'}</span>
              </>
            ) : (
              <>
                <span>{language === 'ur' ? 'دخول کریں' : 'Sign In to Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-stone-400">
          {language === 'ur'
            ? 'سیکیور سپرابیس توثیق • فقط مجاز ایڈمنسٹریٹرز'
            : 'Protected by Supabase Auth with Row Level Security'}
        </p>
      </div>
    </div>
  );
}
