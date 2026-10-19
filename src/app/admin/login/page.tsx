'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/context/LanguageContext';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

export default function AdminLoginPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // Check if the user has admin role via profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError(language === 'ur' ? 'فقط ایڈمن لاگ ان کر سکتا ہے' : 'Only admins can access this portal');
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-8 sm:p-12">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className={`text-2xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
            {language === 'ur' ? 'ایڈمن لاگ ان' : 'Admin Login'}
          </h2>
          <p className="text-stone-600 text-sm mt-2">
            {language === 'ur'
              ? 'دخول کے لیے اپنے ایڈمن email اور پاسورڈ درج کریں۔'
              : 'Enter your admin email and password to access the portal.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-2">
              {language === 'ur' ? 'ای میل ایڈریس' : 'Email Address'}
            </label>
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-2">
              {language === 'ur' ? 'پاسورڈ' : 'Password'}
            </label>
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-800 hover:bg-amber-900 disabled:bg-amber-300 text-white text-sm font-semibold shadow-md transition-colors"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{language === 'ur' ? 'دخول کیا جا رہا ہے...' : 'Signing in...'}</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>{language === 'ur' ? 'دخول کریں' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-stone-500">
          {language === 'ur'
            ? 'یہ پورٹل صرف مجاز ایڈمنстриٹرز کے لیے ہے۔'
            : 'This portal is restricted to authorized administrators only.'}
        </p>
      </div>
    </div>
  );
}