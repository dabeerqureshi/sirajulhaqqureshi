'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import FileUploadDropzone from '@/components/admin/FileUploadDropzone';
import HamdManager from '@/app/admin/components/HamdManager';
import { mockGallery } from '@/lib/data/mockData';
import { AccessRequest, BookItem, ContentItem, GalleryItem, VideoItem } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import {
  ShieldCheck,
  Lock,
  LogOut,
  Users,
  BookOpen,
  Feather,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  FileText,
  Video as VideoIcon,
  Play,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'videos' | 'gallery' | 'poetry' | 'hamd' | 'books'>('requests');

  // Supabase Database State
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [videosList, setVideosList] = useState<VideoItem[]>([]);
  const [booksList, setBooksList] = useState<BookItem[]>([]);
  const [poetryList, setPoetryList] = useState<ContentItem[]>([]);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- SUPABASE ADMIN SESSION GUARD ---
  const [authLoading, setAuthLoading] = useState(true);
  const [currentSessionEmail, setCurrentSessionEmail] = useState('');

  // Fetch all live data from Supabase
  const loadAllData = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;

    setLoadingData(true);
    try {
      const [reqRes, vidRes, bookRes, poetRes, galRes] = await Promise.all([
        supabase.from('access_requests').select('*').order('requested_at', { ascending: false }),
        supabase.from('videos').select('*').order('sort_order', { ascending: true }),
        supabase.from('books').select('*').order('created_at', { ascending: false }),
        supabase.from('content').select('*').eq('type', 'poetry').order('created_at', { ascending: false }),
        supabase.from('gallery').select('*').order('sort_order', { ascending: true }),
      ]);

      if (reqRes.data) setRequests(reqRes.data);
      if (vidRes.data) setVideosList(vidRes.data);
      if (bookRes.data) setBooksList(bookRes.data);
      if (poetRes.data) setPoetryList(poetRes.data);
      if (galRes.data) setGalleryList(galRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      if (!supabase) {
        router.replace('/admin/login');
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/admin/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (cancelled) return;

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        router.replace('/admin/login');
        return;
      }

      setCurrentSessionEmail(session.user.email || '');
      setAuthLoading(false);
      loadAllData();
    })();

    return () => {
      cancelled = true;
    };
  }, [router, loadAllData]);

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  // ==========================================
  // ACCESS REQUESTS
  // ==========================================
  const handleUpdateRequest = async (id: string, newStatus: 'approved' | 'rejected', userId?: string) => {
    const supabase = createClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // If approved, update user's profile role to 'approved_user'
      if (newStatus === 'approved' && userId) {
        await supabase
          .from('profiles')
          .update({ role: 'approved_user', updated_at: new Date().toISOString() })
          .eq('id', userId);
      }

      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
      );
      showToast(`Access request marked as ${newStatus.toUpperCase()}`);
    } catch (err) {
      showToast(`Error updating request: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this access request?')) return;
    const supabase = createClient();
    if (!supabase) return;

    const { error } = await supabase.from('access_requests').delete().eq('id', id);
    if (!error) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showToast('Access request deleted.');
    }
  };

  // ==========================================
  // VIDEOS MANAGEMENT STATE & HANDLERS
  // ==========================================
  const [vidTitleEn, setVidTitleEn] = useState('');
  const [vidTitleUr, setVidTitleUr] = useState('');
  const [vidYoutubeUrl, setVidYoutubeUrl] = useState('');
  const [vidPath, setVidPath] = useState('');
  const [vidDescEn, setVidDescEn] = useState('');
  const [vidDescUr, setVidDescUr] = useState('');
  const [vidCategory, setVidCategory] = useState('Lectures');
  const [vidDuration, setVidDuration] = useState('');
  const [vidVisibility, setVidVisibility] = useState<'public' | 'restricted' | 'secret'>('public');

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    if (!vidYoutubeUrl.trim() && !vidPath.trim()) {
      showToast('Please provide either a YouTube URL or a video path/file.');
      return;
    }

    setSaving(true);
    try {
      const newVideo = {
        title_en: vidTitleEn.trim(),
        title_ur: vidTitleUr.trim(),
        youtube_url: vidYoutubeUrl.trim() || null,
        video_path: vidYoutubeUrl.trim() || vidPath.trim() || 'youtube',
        description_en: vidDescEn.trim() || null,
        description_ur: vidDescUr.trim() || null,
        category: vidCategory,
        duration: vidDuration.trim() || null,
        visibility: vidVisibility,
        published: true,
        sort_order: videosList.length + 1,
      };

      const { data, error } = await supabase
        .from('videos')
        .insert([newVideo])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setVideosList([data, ...videosList]);
      }
      setVidTitleEn('');
      setVidTitleUr('');
      setVidYoutubeUrl('');
      setVidPath('');
      setVidDescEn('');
      setVidDescUr('');
      setVidDuration('');
      showToast('Video added to public archive successfully!');
    } catch (err) {
      showToast(`Error adding video: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    const supabase = createClient();
    if (!supabase) return;

    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (!error) {
      setVideosList((prev) => prev.filter((v) => v.id !== id));
      showToast('Video deleted.');
    } else {
      showToast(`Error deleting video: ${error.message}`);
    }
  };

  // ==========================================
  // GALLERY MANAGEMENT STATE & HANDLERS
  // ==========================================
  const [photoTitleEn, setPhotoTitleEn] = useState('');
  const [photoTitleUr, setPhotoTitleUr] = useState('');
  const [photoDescEn, setPhotoDescEn] = useState('');
  const [photoDescUr, setPhotoDescUr] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Literary Events');
  const [photoVisibility, setPhotoVisibility] = useState<'public' | 'restricted'>('public');
  const [photoDate, setPhotoDate] = useState('');
  const [photoFile, setPhotoFile] = useState<string | null>(null);

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    if (!photoFile) {
      showToast('Please select or upload a photograph.');
      return;
    }

    setSaving(true);
    try {
      const newPhoto = {
        title_en: photoTitleEn.trim(),
        title_ur: photoTitleUr.trim(),
        description_en: photoDescEn.trim() || null,
        description_ur: photoDescUr.trim() || null,
        category: photoCategory,
        file_path: photoFile,
        visibility: photoVisibility,
        sort_order: galleryList.length + 1,
        taken_date: photoDate.trim() || null,
      };

      const { data, error } = await supabase
        .from('gallery')
        .insert([newPhoto])
        .select()
        .single();

      if (error) throw error;

      if (data) setGalleryList([data, ...galleryList]);
      setPhotoTitleEn('');
      setPhotoTitleUr('');
      setPhotoDescEn('');
      setPhotoDescUr('');
      setPhotoFile(null);
      setPhotoDate('');
      showToast('Photograph saved to gallery successfully!');
    } catch (err) {
      showToast(`Error saving photo: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;
    const supabase = createClient();
    if (!supabase) return;

    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (!error) {
      setGalleryList((prev) => prev.filter((p) => p.id !== id));
      showToast('Photograph deleted.');
    } else {
      showToast(`Error deleting photo: ${error.message}`);
    }
  };

  // Seed 25 Archival Photos to Supabase
  const handleSeedArchivalPhotos = async () => {
    const supabase = createClient();
    if (!supabase) return;

    setSaving(true);
    try {
      const photosToInsert = mockGallery.map((p, idx) => ({
        title_en: p.title_en,
        title_ur: p.title_ur,
        description_en: p.description_en,
        description_ur: p.description_ur,
        category: p.category,
        file_path: p.file_path,
        visibility: p.visibility,
        sort_order: idx + 1,
        taken_date: p.taken_date || null,
      }));

      const { data, error } = await supabase
        .from('gallery')
        .insert(photosToInsert)
        .select();

      if (error) throw error;
      if (data) setGalleryList(data);
      showToast(`Successfully populated ${data?.length || 25} archival photos in Supabase!`);
    } catch (err) {
      showToast(`Seed failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // POETRY MANAGEMENT STATE & HANDLERS
  // ==========================================
  const [poemTitleEn, setPoemTitleEn] = useState('');
  const [poemTitleUr, setPoemTitleUr] = useState('');
  const [poemVerseUr, setPoemVerseUr] = useState('');
  const [poemVerseEn, setPoemVerseEn] = useState('');
  const [poemVisibility, setPoemVisibility] = useState<'public' | 'restricted'>('public');
  const [poemMediaFile, setPoemMediaFile] = useState<string | null>(null);

  const handleAddPoem = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    setSaving(true);
    try {
      const newPoem = {
        type: 'poetry',
        title_en: poemTitleEn.trim() || 'Untitled Poem',
        title_ur: poemTitleUr.trim() || 'بلا عنوان',
        subtitle_en: poemMediaFile ? 'Manuscript attached' : 'Published from Archive',
        subtitle_ur: 'تازہ کلام مع دستاویز',
        verses: [
          {
            ur: poemVerseUr.trim(),
            en: poemVerseEn.trim() || undefined,
          },
        ],
        cover_image: poemMediaFile || null,
        visibility: poemVisibility,
        published: true,
        sort_order: poetryList.length + 1,
      };

      const { data, error } = await supabase
        .from('content')
        .insert([newPoem])
        .select()
        .single();

      if (error) throw error;
      if (data) setPoetryList([data, ...poetryList]);
      setPoemTitleEn('');
      setPoemTitleUr('');
      setPoemVerseUr('');
      setPoemVerseEn('');
      setPoemMediaFile(null);
      showToast('Poetic verse published to archive successfully!');
    } catch (err) {
      showToast(`Error publishing poem: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePoem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this poem?')) return;
    const supabase = createClient();
    if (!supabase) return;

    const { error } = await supabase.from('content').delete().eq('id', id);
    if (!error) {
      setPoetryList((prev) => prev.filter((p) => p.id !== id));
      showToast('Poem deleted.');
    } else {
      showToast(`Error deleting poem: ${error.message}`);
    }
  };

  // ==========================================
  // BOOKS MANAGEMENT STATE & HANDLERS
  // ==========================================
  const [bookTitleEn, setBookTitleEn] = useState('');
  const [bookTitleUr, setBookTitleUr] = useState('');
  const [bookAuthorEn, setBookAuthorEn] = useState('Siraj ul Haq Qureshi');
  const [bookAuthorUr, setBookAuthorUr] = useState('سراج الحق قریشی');
  const [bookDescEn, setBookDescEn] = useState('');
  const [bookDescUr, setBookDescUr] = useState('');
  const [bookCategory, setBookCategory] = useState('Literature');
  const [bookVisibility, setBookVisibility] = useState<'public' | 'restricted'>('public');
  const [bookPages, setBookPages] = useState('150');
  const [bookCoverFile, setBookCoverFile] = useState<string | null>(null);
  const [bookPdfFile, setBookPdfFile] = useState<string | null>(null);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    setSaving(true);
    try {
      const newBook = {
        title_en: bookTitleEn.trim(),
        title_ur: bookTitleUr.trim(),
        author_en: bookAuthorEn.trim(),
        author_ur: bookAuthorUr.trim(),
        description_en: bookDescEn.trim() || null,
        description_ur: bookDescUr.trim() || null,
        category: bookCategory,
        cover_path: bookCoverFile || null,
        file_path: bookPdfFile || null,
        visibility: bookVisibility,
        published: true,
        pages_count: parseInt(bookPages) || 150,
        published_year: new Date().getFullYear().toString(),
        download_count: 0,
      };

      const { data, error } = await supabase
        .from('books')
        .insert([newBook])
        .select()
        .single();

      if (error) throw error;
      if (data) setBooksList([data, ...booksList]);
      setBookTitleEn('');
      setBookTitleUr('');
      setBookDescEn('');
      setBookDescUr('');
      setBookCoverFile(null);
      setBookPdfFile(null);
      showToast('Book published to archive successfully!');
    } catch (err) {
      showToast(`Error adding book: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    const supabase = createClient();
    if (!supabase) return;

    const { error } = await supabase.from('books').delete().eq('id', id);
    if (!error) {
      setBooksList((prev) => prev.filter((b) => b.id !== id));
      showToast('Book deleted.');
    } else {
      showToast(`Error deleting book: ${error.message}`);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium">Verifying administrator access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 text-white text-sm font-medium shadow-2xl border border-stone-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 mb-8 border-b border-stone-200 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Production Administrator Console</span>
              </div>
              <h1 className="text-3xl font-bold text-stone-900 font-serif">
                Siraj ul Haq Qureshi Archive
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Connected to Supabase PostgreSQL & Storage • Logged in as <span className="font-mono text-stone-800 font-semibold">{currentSessionEmail}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <span>View Live Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </a>

              <button
                type="button"
                onClick={loadAllData}
                disabled={loadingData}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-amber-700' : ''}`} />
                <span>Refresh Data</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-semibold shadow-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div
              onClick={() => setActiveTab('requests')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeTab === 'requests'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-md'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider">Access Requests</span>
                <Clock className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-2xl font-bold mt-2">{pendingCount} <span className="text-xs font-normal opacity-80">Pending</span></p>
            </div>

            <div
              onClick={() => setActiveTab('videos')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeTab === 'videos'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-md'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider">Videos & Talks</span>
                <VideoIcon className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-2xl font-bold mt-2">{videosList.length} <span className="text-xs font-normal opacity-80">Videos</span></p>
            </div>

            <div
              onClick={() => setActiveTab('gallery')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeTab === 'gallery'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-md'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider">Photographs</span>
                <ImageIcon className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-2xl font-bold mt-2">{galleryList.length} <span className="text-xs font-normal opacity-80">Photos</span></p>
            </div>

            <div
              onClick={() => setActiveTab('poetry')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeTab === 'poetry'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-md'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider">Poetic Verses</span>
                <Feather className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-2xl font-bold mt-2">{poetryList.length} <span className="text-xs font-normal opacity-80">Verses</span></p>
            </div>

            <div
              onClick={() => setActiveTab('books')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeTab === 'books'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-md'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider">Books & PDFs</span>
                <BookOpen className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-2xl font-bold mt-2">{booksList.length} <span className="text-xs font-normal opacity-80">Books</span></p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-stone-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 overflow-x-auto shadow-xs">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Access Requests</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'videos'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <VideoIcon className="w-4 h-4" />
              <span>Videos & YouTube</span>
              <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-xs font-semibold">
                {videosList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Gallery Photographs</span>
              <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-xs font-semibold">
                {galleryList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('poetry')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'poetry'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Feather className="w-4 h-4" />
              <span>Poetic Verses</span>
              <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-xs font-semibold">
                {poetryList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('hamd')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'hamd'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Hamd Manuscripts (حد)</span>
            </button>

            <button
              onClick={() => setActiveTab('books')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'books'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Books & Manuscripts</span>
              <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-xs font-semibold">
                {booksList.length}
              </span>
            </button>
          </div>

          {/* MAIN TAB CONTENT CONTAINER */}
          <div className="bg-white rounded-b-2xl border-x border-b border-stone-200 p-6 sm:p-8 shadow-xs">
            
            {/* ======================================================== */}
            {/* TAB: ACCESS REQUESTS REVIEW & APPROVALS                 */}
            {/* ======================================================== */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">Visitor & Researcher Access Requests</h3>
                  <p className="text-xs text-stone-500">
                    When visitors submit an access request to restricted materials, their requests persist in the Supabase database. Approving upgrades the user profile to approved_user.
                  </p>
                </div>

                {requests.length === 0 ? (
                  <div className="text-center py-12 text-stone-500 text-sm">
                    No access requests submitted yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-stone-200 rounded-xl">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-xs uppercase tracking-wider">
                          <th className="py-3 px-4 font-semibold">User Details</th>
                          <th className="py-3 px-4 font-semibold">Resource</th>
                          <th className="py-3 px-4 font-semibold">Reason</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {requests.map((req) => (
                          <tr key={req.id} className="hover:bg-stone-50/80 transition-colors">
                            <td className="py-4 px-4">
                              <p className="font-semibold text-stone-900">{req.user_name}</p>
                              <p className="text-xs text-stone-500 font-mono">{req.user_email}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 capitalize">
                                <Lock className="w-3 h-3 text-amber-700" />
                                {req.resource_type}
                              </span>
                            </td>
                            <td className="py-4 px-4 max-w-sm text-xs text-stone-600 leading-relaxed">
                              {req.reason}
                            </td>
                            <td className="py-4 px-4">
                              {req.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                                  <Clock className="w-3 h-3" />
                                  Pending Review
                                </span>
                              )}
                              {req.status === 'approved' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                                  <CheckCircle className="w-3 h-3" />
                                  Approved
                                </span>
                              )}
                              {req.status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300">
                                  <XCircle className="w-3 h-3" />
                                  Rejected
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              {req.status === 'pending' ? (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateRequest(req.id, 'approved', req.user_id)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateRequest(req.id, 'rejected')}
                                    className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-rose-100 hover:text-rose-800 text-stone-700 text-xs font-medium"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateRequest(req.id, req.status === 'approved' ? 'rejected' : 'approved', req.user_id)}
                                    className="text-xs text-stone-500 hover:text-stone-800 underline font-medium"
                                  >
                                    Switch to {req.status === 'approved' ? 'Rejected' : 'Approved'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRequest(req.id)}
                                    className="text-stone-400 hover:text-rose-600 p-1"
                                    title="Delete Request"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: VIDEOS & YOUTUBE MANAGEMENT (NEW!)                 */}
            {/* ======================================================== */}
            {activeTab === 'videos' && (
              <div className="space-y-10">
                <form onSubmit={handleAddVideo} className="space-y-6 max-w-3xl border-b border-stone-200 pb-10">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 font-serif">Add New Video / Speech / Mushaira</h3>
                    <p className="text-xs text-stone-500">
                      Add YouTube videos or archived speeches. Videos are saved directly into the Supabase <code className="text-amber-800 font-mono">public.videos</code> table and appear on the public Videos page.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Video Title (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={vidTitleEn}
                        onChange={(e) => setVidTitleEn(e.target.value)}
                        placeholder="e.g. Literary Address at National University"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Video Title (اردو عنوان) *
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        required
                        value={vidTitleUr}
                        onChange={(e) => setVidTitleUr(e.target.value)}
                        placeholder="مثلاً: قومی یونیورسٹی میں صدارتی خطبہ"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      YouTube URL (Preferred for HD Streaming)
                    </label>
                    <input
                      type="url"
                      value={vidYoutubeUrl}
                      onChange={(e) => setVidYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      Pastes like standard YouTube links, Shorts, or embed URLs play inline with an embedded YouTube player.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Category
                      </label>
                      <select
                        value={vidCategory}
                        onChange={(e) => setVidCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="Lectures">Lectures & Addresses / خطبات</option>
                        <option value="Mushaira">Mushaira & Poetry / مشاعرے</option>
                        <option value="Interviews">Interviews / انٹرویوز</option>
                        <option value="Documentary">Documentary / دستاویزی</option>
                        <option value="Personal">Personal Memories / نجی یادیں</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Duration (e.g. 18:45)
                      </label>
                      <input
                        type="text"
                        value={vidDuration}
                        onChange={(e) => setVidDuration(e.target.value)}
                        placeholder="15:30"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Visibility
                      </label>
                      <select
                        value={vidVisibility}
                        onChange={(e) => setVidVisibility(e.target.value as 'public' | 'restricted' | 'secret')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="public">Public (Open to All)</option>
                        <option value="restricted">Restricted (Approved Users)</option>
                        <option value="secret">Secret (Password Protected)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Description (English)
                      </label>
                      <textarea
                        rows={2}
                        value={vidDescEn}
                        onChange={(e) => setVidDescEn(e.target.value)}
                        placeholder="Event background, date, or lecture summary..."
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Description (اردو تفصیل)
                      </label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={vidDescUr}
                        onChange={(e) => setVidDescUr(e.target.value)}
                        placeholder="تقریب کا احوال، تاریخ یا خلاصہ..."
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Video to Supabase</span>
                  </button>
                </form>

                {/* Existing Videos List */}
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-stone-800 font-serif">
                    Current Videos in Database ({videosList.length})
                  </h4>

                  {videosList.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-sm">
                      No videos currently in database. Fill out the form above to add your first YouTube or video recording!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videosList.map((vid) => (
                        <div key={vid.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white transition-all space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-bold text-stone-900 text-sm line-clamp-1">{vid.title_en}</h5>
                              <p className="font-urdu text-stone-600 text-xs mt-0.5 line-clamp-1">{vid.title_ur}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteVideo(vid.id)}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg"
                              title="Delete Video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span className="px-2 py-0.5 rounded-md bg-stone-200/80 font-medium">{vid.category}</span>
                            {vid.duration && <span>⏱️ {vid.duration}</span>}
                            <span className="capitalize ml-auto font-medium text-amber-800">{vid.visibility}</span>
                          </div>

                          {vid.youtube_url && (
                            <a
                              href={vid.youtube_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-900 font-medium"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span className="truncate">Watch: {vid.youtube_url}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: GALLERY PHOTOS (PNG, JPEG, WEBP)                   */}
            {/* ======================================================== */}
            {activeTab === 'gallery' && (
              <div className="space-y-10">
                <form onSubmit={handleAddPhoto} className="space-y-6 max-w-3xl border-b border-stone-200 pb-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900 font-serif">Add Archival Photograph</h3>
                      <p className="text-xs text-stone-500">
                        Upload images or link local archival files into the Supabase <code className="text-amber-800 font-mono">public.gallery</code> table.
                      </p>
                    </div>

                    {galleryList.length === 0 && (
                      <button
                        type="button"
                        onClick={handleSeedArchivalPhotos}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                        <span>Seed 25 Archival Photos to Database</span>
                      </button>
                    )}
                  </div>

                  <FileUploadDropzone
                    label="Select Photo Asset"
                    sublabel="Drag and drop high-resolution photographs into the upload area"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    allowedExtensionsText="PNG, JPEG, JPG, WEBP"
                    maxSizeMB={20}
                    value={photoFile}
                    onFileSelect={(dataUrl) => setPhotoFile(dataUrl)}
                    onClear={() => setPhotoFile(null)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Photo Title (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={photoTitleEn}
                        onChange={(e) => setPhotoTitleEn(e.target.value)}
                        placeholder="e.g. Presiding over 1985 Mushaira"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Photo Title (اردو عنوان) *
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        required
                        value={photoTitleUr}
                        onChange={(e) => setPhotoTitleUr(e.target.value)}
                        placeholder="مثلاً: صدارت قومی مشاعرہ ۱۹۸۵ء"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Archive Category
                      </label>
                      <select
                        value={photoCategory}
                        onChange={(e) => setPhotoCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="Personal Life">Personal Life / ذاتی زندگی</option>
                        <option value="Literary Events">Literary Events / مشاعرے</option>
                        <option value="Ceremonies">Ceremonies / تقریبات</option>
                        <option value="Public Events">Public Events / عوامی اجتماعات</option>
                        <option value="Family Life">Family Life / خاندانی لمحات</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Year / Date Taken
                      </label>
                      <input
                        type="text"
                        value={photoDate}
                        onChange={(e) => setPhotoDate(e.target.value)}
                        placeholder="e.g. 1988 or 28 Oct 2022"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Visibility
                      </label>
                      <select
                        value={photoVisibility}
                        onChange={(e) => setPhotoVisibility(e.target.value as 'public' | 'restricted')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="public">Public (Open to All)</option>
                        <option value="restricted">Restricted (Blurred, Needs Approval)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Caption (English)
                      </label>
                      <textarea
                        rows={2}
                        value={photoDescEn}
                        onChange={(e) => setPhotoDescEn(e.target.value)}
                        placeholder="Context of the photograph..."
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Caption (اردو وضاحتی نوٹ)
                      </label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={photoDescUr}
                        onChange={(e) => setPhotoDescUr(e.target.value)}
                        placeholder="تصویر کے پس منظر کی وضاحت..."
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Photograph to Supabase</span>
                  </button>
                </form>

                {/* Existing Photos List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-stone-800 font-serif">
                      Current Gallery Photographs in Database ({galleryList.length})
                    </h4>
                    {galleryList.length === 0 && (
                      <button
                        type="button"
                        onClick={handleSeedArchivalPhotos}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Seed 25 Archival Photos</span>
                      </button>
                    )}
                  </div>

                  {galleryList.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-sm">
                      No photos saved in database yet. Click the button above to seed all 25 historical Siraj ul Haq Qureshi photographs into Supabase!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {galleryList.map((item) => (
                        <div key={item.id} className="group relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 aspect-square">
                          <img
                            src={item.file_path}
                            alt={item.title_en}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                            <button
                              onClick={() => handleDeletePhoto(item.id)}
                              className="self-end p-1 rounded-md bg-rose-600/90 hover:bg-rose-600 text-white"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <p className="text-[11px] font-semibold truncate">{item.title_en}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: POETRY PUBLISHER (TEXT & SCANS)                    */}
            {/* ======================================================== */}
            {activeTab === 'poetry' && (
              <div className="space-y-10">
                <form onSubmit={handleAddPoem} className="space-y-6 max-w-3xl border-b border-stone-200 pb-10">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 font-serif">Add New Poetry / کلام</h3>
                    <p className="text-xs text-stone-500">
                      Publish couplets and verses to the Supabase <code className="text-amber-800 font-mono">public.content</code> table with type &quot;poetry&quot;.
                    </p>
                  </div>

                  <FileUploadDropzone
                    label="Attach Handwritten Manuscript or Calligraphy Scan (Optional)"
                    sublabel="Original handwritten draft or calligraphy artwork for this poem"
                    accept="image/png, image/jpeg, image/webp, application/pdf"
                    allowedExtensionsText="PNG, JPEG, WEBP, PDF"
                    maxSizeMB={15}
                    value={poemMediaFile}
                    onFileSelect={(dataUrl) => setPoemMediaFile(dataUrl)}
                    onClear={() => setPoemMediaFile(null)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Poem Title (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={poemTitleEn}
                        onChange={(e) => setPoemTitleEn(e.target.value)}
                        placeholder="e.g. Whispers of Dawn"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Poem Title (اردو عنوان) *
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        required
                        value={poemTitleUr}
                        onChange={(e) => setPoemTitleUr(e.target.value)}
                        placeholder="مثلاً: سحر کی سرگوشیاں"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Urdu Verses (اردو اشعار - نستعلیق) *
                    </label>
                    <textarea
                      rows={4}
                      dir="rtl"
                      required
                      value={poemVerseUr}
                      onChange={(e) => setPoemVerseUr(e.target.value)}
                      placeholder="اشعار یہاں درج فرمائیں..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-base font-urdu leading-loose focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      English Translation / Commentary (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={poemVerseEn}
                      onChange={(e) => setPoemVerseEn(e.target.value)}
                      placeholder="English translation or literary commentary..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Visibility
                      </label>
                      <select
                        value={poemVisibility}
                        onChange={(e) => setPoemVisibility(e.target.value as 'public' | 'restricted')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="public">Public (Open to All)</option>
                        <option value="restricted">Restricted (Approved Members Only)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Publish Poem to Supabase</span>
                  </button>
                </form>

                {/* Existing Poetry List */}
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-stone-800 font-serif">
                    Published Poetry in Database ({poetryList.length})
                  </h4>

                  {poetryList.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-sm">
                      No poetry verses stored in database. Use the form above to add verses or visit the Hamd tab to manage Hamd PDFs.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {poetryList.map((poem) => (
                        <div key={poem.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white transition-all space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-bold text-stone-900 text-sm">{poem.title_en}</h5>
                              <p className="font-urdu text-stone-600 text-xs mt-0.5">{poem.title_ur}</p>
                            </div>
                            <button
                              onClick={() => handleDeletePoem(poem.id)}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg"
                              title="Delete Poem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {poem.verses && poem.verses[0] && (
                            <p className="font-urdu text-stone-700 text-sm whitespace-pre-line bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                              {poem.verses[0].ur}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: HAMD PDF MANAGER                                   */}
            {/* ======================================================== */}
            {activeTab === 'hamd' && <HamdManager onToast={showToast} />}

            {/* ======================================================== */}
            {/* TAB: BOOKS UPLOADER (FULL PDF & COVER)                  */}
            {/* ======================================================== */}
            {activeTab === 'books' && (
              <div className="space-y-10">
                <form onSubmit={handleAddBook} className="space-y-6 max-w-3xl border-b border-stone-200 pb-10">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 font-serif">Upload Book & Manuscript</h3>
                    <p className="text-xs text-stone-500">
                      Add new publications to the Supabase <code className="text-amber-800 font-mono">public.books</code> table. Books appear in the digital library and can be read online.
                    </p>
                  </div>

                  <FileUploadDropzone
                    label="1. Book PDF Document"
                    sublabel="Attach the full book PDF for interactive online reading"
                    accept="application/pdf"
                    allowedExtensionsText="PDF Documents (.pdf)"
                    maxSizeMB={50}
                    value={bookPdfFile}
                    onFileSelect={(dataUrl) => setBookPdfFile(dataUrl)}
                    onClear={() => setBookPdfFile(null)}
                  />

                  <FileUploadDropzone
                    label="2. Book Cover Artwork (Optional)"
                    sublabel="Upload front cover image (PNG, JPEG, WEBP)"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    allowedExtensionsText="PNG, JPEG, WEBP"
                    maxSizeMB={10}
                    value={bookCoverFile}
                    onFileSelect={(dataUrl) => setBookCoverFile(dataUrl)}
                    onClear={() => setBookCoverFile(null)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Book Title (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={bookTitleEn}
                        onChange={(e) => setBookTitleEn(e.target.value)}
                        placeholder="e.g. Kulliyat-e-Siraj"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Book Title (اردو عنوان) *
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        required
                        value={bookTitleUr}
                        onChange={(e) => setBookTitleUr(e.target.value)}
                        placeholder="مثلاً: کلیاتِ سراج"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Author (English)
                      </label>
                      <input
                        type="text"
                        value={bookAuthorEn}
                        onChange={(e) => setBookAuthorEn(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Author (اردو)
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={bookAuthorUr}
                        onChange={(e) => setBookAuthorUr(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Total Pages
                      </label>
                      <input
                        type="number"
                        value={bookPages}
                        onChange={(e) => setBookPages(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Category
                      </label>
                      <select
                        value={bookCategory}
                        onChange={(e) => setBookCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="Poetry">Poetry / شاعری</option>
                        <option value="Philosophy">Philosophy / فلسفہ و اخلاق</option>
                        <option value="Memoirs">Memoirs / یادداشتیں</option>
                        <option value="Literature">Literature / نثری ادب</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Visibility
                      </label>
                      <select
                        value={bookVisibility}
                        onChange={(e) => setBookVisibility(e.target.value as 'public' | 'restricted')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="public">Public (Free to Read & Download)</option>
                        <option value="restricted">Restricted (Approved Members Only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Synopsis (English)
                      </label>
                      <textarea
                        rows={2}
                        value={bookDescEn}
                        onChange={(e) => setBookDescEn(e.target.value)}
                        placeholder="Overview of the book..."
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Synopsis (اردو تعارف)
                      </label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={bookDescUr}
                        onChange={(e) => setBookDescUr(e.target.value)}
                        placeholder="کتاب کا اجمالی جائزہ..."
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Publish Book to Supabase</span>
                  </button>
                </form>

                {/* Existing Books List */}
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-stone-800 font-serif">
                    Published Books in Database ({booksList.length})
                  </h4>

                  {booksList.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-sm">
                      No books uploaded to the database yet. Fill out the form above to add your first publication!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {booksList.map((book) => (
                        <div key={book.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white transition-all space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-bold text-stone-900 text-sm line-clamp-1">{book.title_en}</h5>
                              <p className="font-urdu text-stone-600 text-xs mt-0.5 line-clamp-1">{book.title_ur}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg"
                              title="Delete Book"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span className="px-2 py-0.5 rounded-md bg-stone-200/80 font-medium">{book.category}</span>
                            {book.pages_count && <span>📖 {book.pages_count} p.</span>}
                            <span className="capitalize ml-auto font-medium text-amber-800">{book.visibility}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
