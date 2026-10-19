'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import AccessRequestModal from '@/components/modals/AccessRequestModal';
import YouTubeEmbed from '@/components/videos/YouTubeEmbed';
import { Play, Lock, Video, X, KeyRound } from 'lucide-react';
import { decryptFile, fromBase64Url } from '@/lib/crypto';
import type { VideoItem } from '@/types/database';

/** Extract the video ID from common YouTube URL formats (youtu.be, watch?v=, embed/). */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function VideosPage() {
  const { language, t } = useLanguage();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [decryptModal, setDecryptModal] = useState<VideoItem | null>(null);
  const [password, setPassword] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      if (!supabase) {
        // Supabase env vars not configured — render the empty state instead of crashing.
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error) setVideos((data || []).filter((v) => v.published));
      setLoading(false);
    };
    load();
  }, []);

  const handleRequestAccess = (title: string) => {
    setSelectedTitle(title);
    setModalOpen(true);
  };

  const getSignedUrl = async (bucket: string, path: string) => {
    const res = await fetch(
      `/api/signed-url?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`
    );
    const json = await res.json();
    if (!json.signedUrl) throw new Error(json.error || 'Failed to create signed URL');
    return json.signedUrl;
  };

  const handlePlayVideo = async (item: VideoItem) => {
    // YouTube-hosted videos play inline via YouTubeEmbed in the card UI.
    const ytId = item.youtube_url ? extractYouTubeId(item.youtube_url) : null;
    const isLocked =
      item.visibility === 'restricted' ||
      (item.visibility === 'secret' && item.is_encrypted);

    // Unlocked YouTube videos already play inline in the card — nothing to open.
    if (ytId && !isLocked) return;

    // Secret encrypted files: open the password modal and decrypt client-side.
    if (item.visibility === 'secret' && item.is_encrypted) {
      setPassword('');
      setDecryptError('');
      setDecryptModal(item);
      return;
    }

    // Restricted content without a YouTube URL: password modal for encrypted files.
    if (item.visibility === 'restricted') {
      if (!item.is_encrypted) {
        handleRequestAccess(language === 'ur' ? item.title_ur : item.title_en);
        return;
      }
      setPassword('');
      setDecryptError('');
      setDecryptModal(item);
      return;
    }

    // Public video (non-YouTube): open the file via a signed URL or the raw URL.
    if (item.video_path.startsWith('http')) {
      window.open(item.video_path, '_blank');
      return;
    }
    try {
      const signedUrl = await getSignedUrl(
        item.video_path.startsWith('private-assets') ? 'private-assets' : 'public-assets',
        item.video_path
      );
      window.open(signedUrl, '_blank');
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : language === 'ur'
            ? 'ویڈیو لوڈ نہ ہو سکی'
            : 'Failed to load video'
      );
    }
  };

  const handleDecryptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = decryptModal;
    if (!item || !password) return;
    setDecrypting(true);
    setDecryptError('');
    try {
      const signedUrl = await getSignedUrl(
        item.video_path.startsWith('private-assets') ? 'private-assets' : 'public-assets',
        item.video_path
      );
      const res = await fetch(signedUrl);
      const bytes = await res.arrayBuffer();
      const decrypted = await decryptFile(
        new Uint8Array(bytes),
        password,
        fromBase64Url(item.encryption_salt || ''),
        fromBase64Url(item.encryption_salt || '')
      );
      const blob = new Blob([decrypted]);
      window.open(URL.createObjectURL(blob), '_blank');
      setDecryptModal(null);
      setPassword('');
    } catch {
      setDecryptError(
        language === 'ur' ? 'ڈیکرپشن ناکام۔ غلط پاس ورڈ؟' : 'Decryption failed. Wrong password?'
      );
    } finally {
      setDecrypting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-stone-500">
            <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-700 animate-spin" />
            <span className={`text-sm ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur' ? 'ویڈیوز لوڈ ہو رہی ہیں...' : 'Loading videos...'}
            </span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
              <Video className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {language === 'ur' ? 'تقریریں، مشاعرے اور مخصوص ویڈیوز' : 'Speeches, Mushairas & Special Recordings'}
              </span>
            </div>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
              {t('navVideos')}
            </h1>
            <p className={`text-stone-600 text-sm sm:text-base leading-relaxed ${language === 'ur' ? 'font-urdu' : ''}`}>
              {language === 'ur'
                ? 'سراج الحق قریشی کی تقاریر، علمی مجالس اور مشاعروں کا نایاب ویڈیو ریکارڈ۔ کچھ ویڈیوز صرف مجاز صارفین کے لیے مخصوص ہیں۔'
                : 'A curated collection of speeches, intellectual sessions, and mushairas by Siraj ul Haq Qureshi. Some recordings are restricted to authorized viewers.'}
            </p>
          </div>

          {/* Video Grid */}
          {videos.length === 0 ? (
            <div className="text-center py-16 text-stone-500">
              <Video className="w-10 h-10 mx-auto mb-3 text-stone-300" />
              <p className={`text-sm ${language === 'ur' ? 'font-urdu' : ''}`}>
                {language === 'ur' ? 'ابھی کوئی ویڈیو دستیاب نہیں ہے۔' : 'No videos available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((item) => {
                const title = language === 'ur' ? item.title_ur : item.title_en;
                const description = language === 'ur' ? item.description_ur : item.description_en;
                const ytId = item.youtube_url ? extractYouTubeId(item.youtube_url) : null;
                const isLocked =
                  item.visibility === 'restricted' ||
                  (item.visibility === 'secret' && item.is_encrypted);

                return (
                  <article
                    key={item.id}
                    className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Player / Thumbnail Area */}
                    <div className="relative aspect-video bg-stone-900">
                      {isLocked ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-stone-700 to-stone-950" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-300 pointer-events-none">
                            <Lock className="w-7 h-7 text-amber-400" />
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-stone-900/60 ${language === 'ur' ? 'font-urdu' : ''}`}>
                              {language === 'ur' ? 'محدود رسائی' : 'Restricted Access'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePlayVideo(item)}
                            aria-label={`Play ${title}`}
                            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
                          >
                            <span className="w-12 h-12 rounded-full bg-white/90 text-stone-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                            </span>
                          </button>
                        </>
                      ) : ytId ? (
                        <YouTubeEmbed videoId={ytId} title={title} className="aspect-video" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePlayVideo(item)}
                          aria-label={`Play ${title}`}
                          className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-700 to-stone-900 hover:from-stone-600 hover:to-stone-800 transition-colors cursor-pointer"
                        >
                          <span className="w-12 h-12 rounded-full bg-white/90 text-stone-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-base font-bold text-stone-900 leading-snug ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                          {title}
                        </h3>
                        {item.duration && (
                          <span className="shrink-0 text-[11px] font-medium text-stone-500 bg-stone-100 rounded px-1.5 py-0.5">
                            {item.duration}
                          </span>
                        )}
                      </div>
                      {description && (
                        <p className={`text-sm text-stone-600 leading-relaxed line-clamp-2 ${language === 'ur' ? 'font-urdu' : ''}`}>
                          {description}
                        </p>
                      )}
                      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                        {item.category && (
                          <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 rounded-full px-2.5 py-1">
                            {item.category}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePlayVideo(item)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors ${!isLocked && ytId ? 'invisible group-hover:visible' : ''}`}
                        >
                          {isLocked ? (
                            <>
                              <KeyRound className="w-3.5 h-3.5" />
                              {language === 'ur' ? 'رسائی درخواست' : 'Request Access'}
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              {language === 'ur' ? 'چلائیں' : 'Play'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Restricted-content decrypt modal */}
      {decryptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleDecryptSubmit}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-4"
          >
            <button
              type="button"
              onClick={() => setDecryptModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold text-stone-900 ${language === 'ur' ? 'font-urdu' : 'font-serif'}`}>
                {language === 'ur' ? 'خفیہ ویڈیو کھولیں' : 'Open Protected Video'}
              </h2>
              <p className={`text-sm text-stone-600 mt-1 ${language === 'ur' ? 'font-urdu' : ''}`}>
                {language === 'ur'
                  ? 'اس ویڈیو کو دیکھنے کے لیے خفیہ پاس ورڈ درج کریں۔'
                  : 'Enter the secret password to decrypt and watch this video.'}
              </p>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder={language === 'ur' ? 'پاس ورڈ' : 'Password'}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700/30"
            />
            {decryptError && (
              <p className={`text-xs text-red-600 ${language === 'ur' ? 'font-urdu' : ''}`}>{decryptError}</p>
            )}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDecryptModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
              >
                {language === 'ur' ? 'منسوخ' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!password || decrypting}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
              >
                {decrypting && (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                )}
                {language === 'ur' ? 'چلائیں' : 'Play'}
              </button>
            </div>
          </form>
        </div>
      )}

      <AccessRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resourceTitle={selectedTitle}
        resourceType="Video"
      />
    </div>
  );
}
