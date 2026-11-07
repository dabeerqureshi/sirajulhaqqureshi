'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side errors
    console.error('Application Error Boundary caught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 text-white p-6 relative">
      <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-serif text-stone-100">
            Unexpected Situation Occurred
          </h2>
          <p className="font-urdu text-lg text-amber-200 leading-loose">
            تکنیکی مسئلہ پیش آ گیا۔ سسٹم خودکار طور پر بحال ہو رہا ہے۔
          </p>
          <p className="text-xs text-stone-400 leading-relaxed">
            {error?.message || 'A transient failure occurred while processing this request.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again / دوبارہ کوشش کریں</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
