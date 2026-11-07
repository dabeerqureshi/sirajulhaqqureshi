import Link from 'next/link';
import { Compass, Home, BookOpen, Feather } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-white px-4 py-16 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-900/30 border border-amber-700/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">
            Error 404 / صفحہ دستیاب نہیں
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100">
            Page Not Found
          </h1>
          <p className="font-urdu text-xl text-amber-200/90 leading-loose">
            مطلوبہ صفحہ یا ادبی دستاویز دستیاب نہیں ہے۔
          </p>
          <p className="text-sm text-stone-400 leading-relaxed max-w-sm mx-auto">
            The manuscript, poem, or page you are looking for may have been moved, renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Quick Nav Action Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Return Home / مرکزی صفحہ</span>
          </Link>
          <Link
            href="/poetry"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-sm font-semibold transition-all"
          >
            <Feather className="w-4 h-4 text-amber-400" />
            <span>Poetry / کلام</span>
          </Link>
          <Link
            href="/books"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-sm font-semibold transition-all"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Books / کتب</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
