'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import FileUploadDropzone from '@/components/admin/FileUploadDropzone';
import HamdManager from '@/app/admin/components/HamdManager';
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
  RefreshCw,
  Sparkles,
  Loader2,
  Pencil,
  UploadCloud,
  X
} from 'lucide-react';

type EditingItem =
  | { type: 'video'; item: VideoItem }
  | { type: 'gallery'; item: GalleryItem }
  | { type: 'poetry'; item: ContentItem }
  | { type: 'book'; item: BookItem };

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

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

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

  // Clear all photos from Supabase gallery
  const handleClearAllPhotos = async () => {
    if (!confirm('Are you sure you want to delete all photos from the database? This cannot be undone.')) return;
    const supabase = createClient();
    if (!supabase) return;

    setSaving(true);
    try {
      const ids = galleryList.map((g) => g.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from('gallery').delete().in('id', ids);
      if (error) throw error;
      setGalleryList([]);
      showToast('All photos deleted from database.');
    } catch (err) {
      showToast(`Error deleting photos: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  // ==========================================
  // UNIFIED EDIT / UPDATE HANDLER
  // ==========================================
  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    const supabase = createClient();
    if (!supabase) return;

    setUpdating(true);
    const formData = new FormData(e.currentTarget);
    const { type, item } = editingItem;

    try {
      if (type === 'video') {
        const updates = {
          title_en: (formData.get('title_en') as string).trim(),
          title_ur: (formData.get('title_ur') as string).trim(),
          youtube_url: (formData.get('youtube_url') as string).trim() || null,
          video_path: (formData.get('video_path') as string).trim() || (formData.get('youtube_url') as string).trim() || 'youtube',
          category: formData.get('category') as string,
          duration: (formData.get('duration') as string).trim() || null,
          visibility: formData.get('visibility') as 'public' | 'restricted' | 'secret',
          description_en: (formData.get('description_en') as string).trim() || null,
          description_ur: (formData.get('description_ur') as string).trim() || null,
          published: formData.get('published') === 'on',
        };

        const { error } = await supabase.from('videos').update(updates).eq('id', item.id);
        if (error) throw error;
        setVideosList((prev) => prev.map((v) => (v.id === item.id ? { ...v, ...updates } : v)));
        showToast('Video updated successfully in Supabase!');
      } else if (type === 'gallery') {
        const filePath = (editPhotoFile || (formData.get('file_path') as string) || '').trim();
        const updates = {
          title_en: (formData.get('title_en') as string).trim(),
          title_ur: (formData.get('title_ur') as string).trim(),
          category: formData.get('category') as string,
          taken_date: (formData.get('taken_date') as string).trim() || null,
          file_path: filePath,
          visibility: formData.get('visibility') as 'public' | 'restricted',
          description_en: (formData.get('description_en') as string).trim() || null,
          description_ur: (formData.get('description_ur') as string).trim() || null,
        };

        const { error } = await supabase.from('gallery').update(updates).eq('id', item.id);
        if (error) throw error;
        setGalleryList((prev) => prev.map((g) => (g.id === item.id ? { ...g, ...updates } : g)));
        showToast('Photograph updated successfully in Supabase!');
      } else if (type === 'poetry') {
        const urVerse = (formData.get('poemVerseUr') as string).trim();
        const enVerse = (formData.get('poemVerseEn') as string).trim();
        const updates = {
          title_en: (formData.get('title_en') as string).trim(),
          title_ur: (formData.get('title_ur') as string).trim(),
          subtitle_en: (formData.get('subtitle_en') as string).trim() || null,
          subtitle_ur: (formData.get('subtitle_ur') as string).trim() || null,
          verses: [{ ur: urVerse, en: enVerse || undefined }],
          visibility: formData.get('visibility') as 'public' | 'restricted',
          published: formData.get('published') === 'on',
        };

        const { error } = await supabase.from('content').update(updates).eq('id', item.id);
        if (error) throw error;
        setPoetryList((prev) => prev.map((p) => (p.id === item.id ? { ...p, ...updates } : p)));
        showToast('Poetic verse updated successfully in Supabase!');
      } else if (type === 'book') {
        const updates = {
          title_en: (formData.get('title_en') as string).trim(),
          title_ur: (formData.get('title_ur') as string).trim(),
          author_en: (formData.get('author_en') as string).trim(),
          author_ur: (formData.get('author_ur') as string).trim(),
          category: formData.get('category') as string,
          pages_count: parseInt(formData.get('pages_count') as string) || null,
          published_year: (formData.get('published_year') as string).trim() || null,
          cover_path: (formData.get('cover_path') as string).trim() || null,
          file_path: (formData.get('file_path') as string).trim() || null,
          visibility: formData.get('visibility') as 'public' | 'restricted',
          description_en: (formData.get('description_en') as string).trim() || null,
          description_ur: (formData.get('description_ur') as string).trim() || null,
          published: formData.get('published') === 'on',
        };

        const { error } = await supabase.from('books').update(updates).eq('id', item.id);
        if (error) throw error;
        setBooksList((prev) => prev.map((b) => (b.id === item.id ? { ...b, ...updates } : b)));
        showToast('Book updated successfully in Supabase!');
      }
      setEditingItem(null);
      setEditPhotoFile(null);
    } catch (err) {
      showToast(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
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
            {/* TAB: VIDEOS & YOUTUBE MANAGEMENT                         */}
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
                        <div key={vid.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white transition-all space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-stone-900 text-sm line-clamp-1">{vid.title_en}</h5>
                                <p className="font-urdu text-stone-600 text-xs mt-0.5 line-clamp-1">{vid.title_ur}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setEditingItem({ type: 'video', item: vid })}
                                  className="text-stone-400 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                                  title="Edit Video"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVideo(vid.id)}
                                  className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Delete Video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {vid.description_en && (
                              <p className="text-xs text-stone-500 line-clamp-2">{vid.description_en}</p>
                            )}
                          </div>

                          <div className="space-y-2 pt-2 border-t border-stone-100">
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: GALLERY PHOTOS                                      */}
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
                    {galleryList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllPhotos}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete All Photos</span>
                      </button>
                    )}
                  </div>

                  {galleryList.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-sm">
                      No photos in database. Use the form above to upload new photographs to the archive!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {galleryList.map((item) => (
                        <div key={item.id} className="group relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950 aspect-square flex items-center justify-center p-1.5 shadow-xs">
                          {/* Ambient blurred backdrop so any aspect ratio (portrait/landscape/scan) fits elegantly */}
                          <div
                            className="absolute inset-0 bg-cover bg-center filter blur-md opacity-35 scale-125"
                            style={{ backgroundImage: `url(${item.file_path})` }}
                          />
                          <img
                            src={item.file_path}
                            alt={item.title_en}
                            className="relative z-10 max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 z-20 bg-stone-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                            <div className="flex items-center justify-end gap-1.5 self-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItem({ type: 'gallery', item });
                                  setEditPhotoFile(item.file_path);
                                }}
                                className="p-1 rounded-md bg-stone-900/90 hover:bg-amber-700 text-white transition-colors"
                                title="Edit Photo"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(item.id)}
                                className="p-1 rounded-md bg-rose-600/90 hover:bg-rose-600 text-white transition-colors"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold truncate">{item.title_en}</p>
                              <p className="text-[10px] text-amber-300 font-urdu truncate">{item.title_ur}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: POETRY PUBLISHER                                    */}
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
                        <div key={poem.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white transition-all space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-stone-900 text-sm">{poem.title_en}</h5>
                                <p className="font-urdu text-stone-600 text-xs mt-0.5">{poem.title_ur}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setEditingItem({ type: 'poetry', item: poem })}
                                  className="text-stone-400 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                                  title="Edit Poem"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePoem(poem.id)}
                                  className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Delete Poem"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {poem.verses && poem.verses[0] && (
                              <p className="font-urdu text-stone-700 text-sm whitespace-pre-line bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                                {poem.verses[0].ur}
                              </p>
                            )}
                          </div>

                          <div className="text-[11px] text-stone-500 flex items-center justify-between pt-2 border-t border-stone-100">
                            <span className="capitalize text-amber-800 font-medium">{poem.visibility}</span>
                            <span>{new Date(poem.created_at).toLocaleDateString()}</span>
                          </div>
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
                        <div key={book.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white transition-all space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-stone-900 text-sm line-clamp-1">{book.title_en}</h5>
                                <p className="font-urdu text-stone-600 text-xs mt-0.5 line-clamp-1">{book.title_ur}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setEditingItem({ type: 'book', item: book })}
                                  className="text-stone-400 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                                  title="Edit Book"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBook(book.id)}
                                  className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Delete Book"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {book.description_en && (
                              <p className="text-xs text-stone-500 line-clamp-2">{book.description_en}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-stone-500 pt-2 border-t border-stone-100">
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

      {/* ======================================================== */}
      {/* UNIVERSAL EDIT MODAL FOR ALL MEDIA & CONTENT             */}
      {/* ======================================================== */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={() => !updating && setEditingItem(null)}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6 my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Editing {editingItem.type.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold text-stone-900 font-serif">
                  {editingItem.type === 'video' && 'Edit Video & YouTube Details'}
                  {editingItem.type === 'gallery' && 'Edit Photograph Metadata'}
                  {editingItem.type === 'poetry' && 'Edit Poetic Verses'}
                  {editingItem.type === 'book' && 'Edit Publication Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                disabled={updating}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* VIDEO EDIT FIELDS */}
              {editingItem.type === 'video' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Video Title (English) *
                      </label>
                      <input
                        name="title_en"
                        type="text"
                        required
                        defaultValue={editingItem.item.title_en}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Video Title (اردو عنوان) *
                      </label>
                      <input
                        name="title_ur"
                        type="text"
                        dir="rtl"
                        required
                        defaultValue={editingItem.item.title_ur}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      YouTube URL
                    </label>
                    <input
                      name="youtube_url"
                      type="url"
                      defaultValue={editingItem.item.youtube_url || ''}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        defaultValue={editingItem.item.category || 'Lectures'}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
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
                        Duration
                      </label>
                      <input
                        name="duration"
                        type="text"
                        defaultValue={editingItem.item.duration || ''}
                        placeholder="18:45"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Visibility
                      </label>
                      <select
                        name="visibility"
                        defaultValue={editingItem.item.visibility}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="public">Public</option>
                        <option value="restricted">Restricted</option>
                        <option value="secret">Secret</option>
                      </select>
                    </div>
                  </div>

                  <input
                    type="hidden"
                    name="video_path"
                    defaultValue={editingItem.item.video_path || ''}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Description (English)
                      </label>
                      <textarea
                        name="description_en"
                        rows={2}
                        defaultValue={editingItem.item.description_en || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Description (اردو)
                      </label>
                      <textarea
                        name="description_ur"
                        rows={2}
                        dir="rtl"
                        defaultValue={editingItem.item.description_ur || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      name="published"
                      defaultChecked={editingItem.item.published !== false}
                      className="rounded text-amber-800"
                    />
                    <span>Published & Visible on Website</span>
                  </label>
                </>
              )}

              {/* GALLERY EDIT FIELDS */}
              {editingItem.type === 'gallery' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Photo Title (English) *
                      </label>
                      <input
                        name="title_en"
                        type="text"
                        required
                        defaultValue={editingItem.item.title_en}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Photo Title (اردو عنوان) *
                      </label>
                      <input
                        name="title_ur"
                        type="text"
                        dir="rtl"
                        required
                        defaultValue={editingItem.item.title_ur}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        defaultValue={editingItem.item.category || 'Literary Events'}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
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
                        name="taken_date"
                        type="text"
                        defaultValue={editingItem.item.taken_date || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Visibility
                      </label>
                      <select
                        name="visibility"
                        defaultValue={editingItem.item.visibility}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="public">Public</option>
                        <option value="restricted">Restricted (Blurred)</option>
                      </select>
                    </div>
                  </div>

                  {/* Photo Preview & Live Image Replacement */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1.5">
                      Photograph Preview & Replace
                    </label>
                    <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 p-4 flex flex-col items-center justify-center min-h-[220px] shadow-inner">
                      <div
                        className="absolute inset-0 bg-cover bg-center filter blur-lg opacity-35 scale-125"
                        style={{ backgroundImage: `url(${editPhotoFile || editingItem.item.file_path})` }}
                      />
                      <img
                        src={editPhotoFile || editingItem.item.file_path}
                        alt="Preview"
                        className="relative z-10 max-h-60 max-w-full object-contain rounded-lg shadow-md"
                      />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors shadow-xs">
                        <UploadCloud className="w-4 h-4 text-amber-400" />
                        <span>Upload Replacement Picture</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) => {
                                if (typeof uploadEvent.target?.result === 'string') {
                                  setEditPhotoFile(uploadEvent.target.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[11px] text-stone-500">
                        Supports any aspect ratio or dimension (portrait, landscape, tall scans) without cropping.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      File Path / Image Source
                    </label>
                    <input
                      name="file_path"
                      type="text"
                      required
                      value={editPhotoFile || editingItem.item.file_path}
                      onChange={(e) => setEditPhotoFile(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Caption (English)
                      </label>
                      <textarea
                        name="description_en"
                        rows={2}
                        defaultValue={editingItem.item.description_en || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Caption (اردو)
                      </label>
                      <textarea
                        name="description_ur"
                        rows={2}
                        dir="rtl"
                        defaultValue={editingItem.item.description_ur || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* POETRY EDIT FIELDS */}
              {editingItem.type === 'poetry' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Poem Title (English) *
                      </label>
                      <input
                        name="title_en"
                        type="text"
                        required
                        defaultValue={editingItem.item.title_en}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Poem Title (اردو عنوان) *
                      </label>
                      <input
                        name="title_ur"
                        type="text"
                        dir="rtl"
                        required
                        defaultValue={editingItem.item.title_ur}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Subtitle (English)
                      </label>
                      <input
                        name="subtitle_en"
                        type="text"
                        defaultValue={editingItem.item.subtitle_en || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Subtitle (اردو)
                      </label>
                      <input
                        name="subtitle_ur"
                        type="text"
                        dir="rtl"
                        defaultValue={editingItem.item.subtitle_ur || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Urdu Verses (اردو اشعار - نستعلیق) *
                    </label>
                    <textarea
                      name="poemVerseUr"
                      rows={4}
                      dir="rtl"
                      required
                      defaultValue={editingItem.item.verses?.[0]?.ur || ''}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-base font-urdu leading-loose"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      English Translation / Commentary
                    </label>
                    <textarea
                      name="poemVerseEn"
                      rows={2}
                      defaultValue={editingItem.item.verses?.[0]?.en || ''}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Visibility
                      </label>
                      <select
                        name="visibility"
                        defaultValue={editingItem.item.visibility}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                      >
                        <option value="public">Public</option>
                        <option value="restricted">Restricted</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer pt-4">
                      <input
                        type="checkbox"
                        name="published"
                        defaultChecked={editingItem.item.published !== false}
                        className="rounded text-amber-800"
                      />
                      <span>Published</span>
                    </label>
                  </div>
                </>
              )}

              {/* BOOK EDIT FIELDS */}
              {editingItem.type === 'book' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Book Title (English) *
                      </label>
                      <input
                        name="title_en"
                        type="text"
                        required
                        defaultValue={editingItem.item.title_en}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Book Title (اردو عنوان) *
                      </label>
                      <input
                        name="title_ur"
                        type="text"
                        dir="rtl"
                        required
                        defaultValue={editingItem.item.title_ur}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Author (English)
                      </label>
                      <input
                        name="author_en"
                        type="text"
                        defaultValue={editingItem.item.author_en}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Author (اردو)
                      </label>
                      <input
                        name="author_ur"
                        type="text"
                        dir="rtl"
                        defaultValue={editingItem.item.author_ur}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        defaultValue={editingItem.item.category || 'Literature'}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                      >
                        <option value="Poetry">Poetry / شاعری</option>
                        <option value="Philosophy">Philosophy / فلسفہ و اخلاق</option>
                        <option value="Memoirs">Memoirs / یادداشتیں</option>
                        <option value="Literature">Literature / نثری ادب</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Total Pages
                      </label>
                      <input
                        name="pages_count"
                        type="number"
                        defaultValue={editingItem.item.pages_count || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Year
                      </label>
                      <input
                        name="published_year"
                        type="text"
                        defaultValue={editingItem.item.published_year || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        PDF File Path
                      </label>
                      <input
                        name="file_path"
                        type="text"
                        defaultValue={editingItem.item.file_path || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Cover Image Path
                      </label>
                      <input
                        name="cover_path"
                        type="text"
                        defaultValue={editingItem.item.cover_path || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Synopsis (English)
                      </label>
                      <textarea
                        name="description_en"
                        rows={2}
                        defaultValue={editingItem.item.description_en || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Synopsis (اردو)
                      </label>
                      <textarea
                        name="description_ur"
                        rows={2}
                        dir="rtl"
                        defaultValue={editingItem.item.description_ur || ''}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                        Visibility
                      </label>
                      <select
                        name="visibility"
                        defaultValue={editingItem.item.visibility}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                      >
                        <option value="public">Public</option>
                        <option value="restricted">Restricted</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer pt-4">
                      <input
                        type="checkbox"
                        name="published"
                        defaultChecked={editingItem.item.published !== false}
                        className="rounded text-amber-800"
                      />
                      <span>Published</span>
                    </label>
                  </div>
                </>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={updating}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
