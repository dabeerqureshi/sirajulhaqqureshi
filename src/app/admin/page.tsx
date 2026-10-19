'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import FileUploadDropzone from '@/components/admin/FileUploadDropzone';
import { useLanguage } from '@/context/LanguageContext';
import {
  loginAdmin,
  logoutAdmin,
  getAdminSession,
  isAdminAuthenticated,
  ADMIN_CONFIG
} from '@/lib/auth/adminAuth';
import { mockAccessRequests, mockBooks, mockPoetry, mockGallery } from '@/lib/data/mockData';
import { AccessRequest, BookItem, ContentItem, GalleryItem } from '@/types/database';
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  Users,
  BookOpen,
  Feather,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Check,
  AlertCircle,
  ArrowRight,
  FileText
} from 'lucide-react';

export default function AdminPage() {
  const { language } = useLanguage();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentSessionEmail, setCurrentSessionEmail] = useState<string>('');

  // Dashboard Tabs: 'requests' | 'poetry' | 'books' | 'gallery'
  const [activeTab, setActiveTab] = useState<'requests' | 'poetry' | 'books' | 'gallery'>('requests');

  // Live Database State (Initialized from data stores)
  const [requests, setRequests] = useState<AccessRequest[]>(mockAccessRequests);
  const [booksList, setBooksList] = useState<BookItem[]>(mockBooks);
  const [poetryList, setPoetryList] = useState<ContentItem[]>(mockPoetry);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(mockGallery);

  // Toast feedback banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check persistent session on mount
  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setIsAuthenticated(true);
      setCurrentSessionEmail(session.email);
    }
    setAuthLoading(false);
  }, []);

  // Handle Login Submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const res = loginAdmin(adminEmail, adminPassword);
    if (res.success) {
      setIsAuthenticated(true);
      setCurrentSessionEmail(adminEmail.trim().toLowerCase());
      setAdminPassword('');
      showToast('Welcome back, Administrator. Security token validated.');
    } else {
      setLoginError(res.message || 'Invalid credentials.');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
    setCurrentSessionEmail('');
    showToast('Signed out of administrative console safely.');
  };

  // --- ACCESS REQUESTS MANAGEMENT ---
  const handleUpdateRequest = (id: string, newStatus: 'approved' | 'rejected') => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );
    showToast(`Access request marked as ${newStatus.toUpperCase()}`);
  };

  // --- TAB 1: POETRY PUBLISHER STATE ---
  const [poemTitleEn, setPoemTitleEn] = useState('');
  const [poemTitleUr, setPoemTitleUr] = useState('');
  const [poemVerseUr, setPoemVerseUr] = useState('');
  const [poemVerseEn, setPoemVerseEn] = useState('');
  const [poemVisibility, setPoemVisibility] = useState<'public' | 'restricted'>('public');
  const [poemMediaFile, setPoemMediaFile] = useState<string | null>(null);

  const handleAddPoem = (e: React.FormEvent) => {
    e.preventDefault();
    const newPoem: ContentItem = {
      id: `poetry-${Date.now()}`,
      type: 'poetry',
      title_en: poemTitleEn || 'Untitled Poem',
      title_ur: poemTitleUr || 'بلا عنوان',
      subtitle_en: poemMediaFile ? 'Manuscript attached' : 'Published from Admin',
      subtitle_ur: 'تازہ کلام مع دستاویز',
      verses: [
        {
          ur: poemVerseUr || 'کوئی شعر یہاں درج نہیں کیا گیا',
          en: poemVerseEn || 'No translation provided'
        }
      ],
      cover_image: poemMediaFile || 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&q=80&w=800',
      visibility: poemVisibility,
      published: true,
      sort_order: poetryList.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setPoetryList([newPoem, ...poetryList]);
    setPoemTitleEn('');
    setPoemTitleUr('');
    setPoemVerseUr('');
    setPoemVerseEn('');
    setPoemMediaFile(null);
    showToast('Poetic verse published to archive successfully!');
  };

  // --- TAB 2: BOOKS & PDF PUBLISHER STATE ---
  const [bookTitleEn, setBookTitleEn] = useState('');
  const [bookTitleUr, setBookTitleUr] = useState('');
  const [bookAuthorEn, setBookAuthorEn] = useState('Siraj ul Haq Qureshi');
  const [bookAuthorUr, setBookAuthorUr] = useState('سراج الحق قریشی');
  const [bookDescEn, setBookDescEn] = useState('');
  const [bookDescUr, setBookDescUr] = useState('');
  const [bookCategory, setBookCategory] = useState('Poetry');
  const [bookVisibility, setBookVisibility] = useState<'public' | 'restricted'>('public');
  const [bookPages, setBookPages] = useState('220');
  const [bookCoverFile, setBookCoverFile] = useState<string | null>(null);
  const [bookPdfFile, setBookPdfFile] = useState<string | null>(null);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const newBook: BookItem = {
      id: `book-${Date.now()}`,
      title_en: bookTitleEn || 'New Book Publication',
      title_ur: bookTitleUr || 'کتاب',
      author_en: bookAuthorEn,
      author_ur: bookAuthorUr,
      description_en: bookDescEn || 'Complete book manuscript available in digital archive.',
      description_ur: bookDescUr || 'مکمل کتاب ڈیجیٹل کتب خانے میں مطالعہ کے لیے دستیاب ہے۔',
      category: bookCategory,
      cover_path: bookCoverFile || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
      file_path: bookPdfFile || '/sample-books/kulliyat-e-siraj.pdf',
      visibility: bookVisibility,
      published: true,
      pages_count: parseInt(bookPages) || 150,
      published_year: new Date().getFullYear().toString(),
      download_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setBooksList([newBook, ...booksList]);
    setBookTitleEn('');
    setBookTitleUr('');
    setBookDescEn('');
    setBookDescUr('');
    setBookCoverFile(null);
    setBookPdfFile(null);
    showToast('Book and PDF attached to main archive. Full book is now readable!');
  };

  // --- TAB 3: GALLERY ARCHIVE STATE ---
  const [photoTitleEn, setPhotoTitleEn] = useState('');
  const [photoTitleUr, setPhotoTitleUr] = useState('');
  const [photoDescEn, setPhotoDescEn] = useState('');
  const [photoDescUr, setPhotoDescUr] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Literary Events');
  const [photoVisibility, setPhotoVisibility] = useState<'public' | 'restricted'>('public');
  const [photoDate, setPhotoDate] = useState('1988');
  const [photoFile, setPhotoFile] = useState<string | null>(null);

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) {
      alert('Please upload an image file (PNG, JPEG, or WEBP).');
      return;
    }

    const newPhoto: GalleryItem = {
      id: `photo-${Date.now()}`,
      title_en: photoTitleEn || 'Archival Photograph',
      title_ur: photoTitleUr || 'تصویری یادداشت',
      description_en: photoDescEn,
      description_ur: photoDescUr,
      category: photoCategory,
      file_path: photoFile,
      visibility: photoVisibility,
      sort_order: galleryList.length + 1,
      taken_date: photoDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setGalleryList([newPhoto, ...galleryList]);
    setPhotoTitleEn('');
    setPhotoTitleUr('');
    setPhotoDescEn('');
    setPhotoDescUr('');
    setPhotoFile(null);
    showToast('Archival photograph uploaded and saved to gallery!');
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // VIEW 1: SECURE ADMIN LOGIN SCREEN (If not logged in)
  // ==============================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-16">
          <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* Header Icon */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-900 text-amber-200 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/50 border border-amber-600/40">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold font-serif text-white">
                Admin Console
              </h2>
              <p className="text-xs text-stone-400">
                Restricted access for Siraj ul Haq Qureshi archive management
              </p>
            </div>

            {/* Error Notification */}
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="qureshidabeer92@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950/70 border border-stone-800 text-white placeholder-stone-600 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-950/70 border border-stone-800 text-white placeholder-stone-600 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-950/50 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Authenticate & Enter Portal</span>
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-stone-800/80 text-center">
              <Link
                href="/"
                className="text-xs text-stone-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
              >
                <span>&larr; Return to Public Digital Archive</span>
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ==============================================================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  // ==============================================================================
  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Admin Security Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-stone-300 gap-4 bg-white p-6 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-800 text-amber-100 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
                    Administrator Command Center
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    AUTHENTICATED
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Logged in as: <strong className="text-stone-800 font-mono">{currentSessionEmail || ADMIN_CONFIG.email}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs font-semibold border border-stone-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-6 p-4 rounded-xl bg-stone-900 text-amber-200 text-sm font-medium shadow-lg flex items-center justify-between animate-fade-in border border-amber-900/50">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div
              onClick={() => setActiveTab('requests')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                activeTab === 'requests'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-md'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider">Access Requests</span>
                <Clock className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-3xl font-bold mt-2">{pendingCount} <span className="text-xs font-normal opacity-80">Pending</span></p>
            </div>

            <div
              onClick={() => setActiveTab('books')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                activeTab === 'books'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-md'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider">Books & Library</span>
                <BookOpen className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-3xl font-bold mt-2">{booksList.length} <span className="text-xs font-normal opacity-80">Publications</span></p>
            </div>

            <div
              onClick={() => setActiveTab('poetry')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                activeTab === 'poetry'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-md'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider">Poetic Verses</span>
                <Feather className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-3xl font-bold mt-2">{poetryList.length} <span className="text-xs font-normal opacity-80">Poems</span></p>
            </div>

            <div
              onClick={() => setActiveTab('gallery')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                activeTab === 'gallery'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-md'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold tracking-wider">Archival Media</span>
                <ImageIcon className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-3xl font-bold mt-2">{galleryList.length} <span className="text-xs font-normal opacity-80">Photographs</span></p>
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
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Upload Photos (PNG, JPEG, WEBP)</span>
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
              <span>Publish Poetry (Text & Scans)</span>
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
              <span>Upload Books (Full PDF)</span>
            </button>
          </div>

          {/* MAIN TAB CONTENT CONTAINER */}
          <div className="bg-white rounded-b-2xl border-x border-b border-stone-200 p-6 sm:p-8 shadow-xs">
            
            {/* ======================================================== */}
            {/* TAB 1: ACCESS REQUESTS REVIEW & APPROVALS                */}
            {/* ======================================================== */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 font-serif">Visitor & Researcher Access Requests</h3>
                    <p className="text-xs text-stone-500">
                      When users request access to restricted family archives or private manuscripts, their requests appear here. Click Approve to grant access.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4 font-semibold">User Details</th>
                        <th className="py-3 px-4 font-semibold">Resource Requested</th>
                        <th className="py-3 px-4 font-semibold">Reason for Request</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Approval Actions</th>
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
                                  onClick={() => handleUpdateRequest(req.id, 'approved')}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateRequest(req.id, 'rejected')}
                                  className="px-3.5 py-1.5 rounded-lg bg-stone-200 hover:bg-rose-100 hover:text-rose-800 text-stone-700 text-xs font-medium"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleUpdateRequest(req.id, req.status === 'approved' ? 'rejected' : 'approved')}
                                className="text-xs text-stone-500 hover:text-stone-800 underline font-medium"
                              >
                                Change to {req.status === 'approved' ? 'Rejected' : 'Approved'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: GALLERY PHOTOS UPLOADER (PNG, JPEG, WEBP)         */}
            {/* ======================================================== */}
            {activeTab === 'gallery' && (
              <form onSubmit={handleAddPhoto} className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">Upload Archival Photograph</h3>
                  <p className="text-xs text-stone-500">
                    Upload images from historic gatherings, personal portraits, and family archives. Supports PNG, JPEG, and WEBP.
                  </p>
                </div>

                {/* File Upload Dropzone for Photos */}
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
                      Photo Title (English)
                    </label>
                    <input
                      type="text"
                      required
                      value={photoTitleEn}
                      onChange={(e) => setPhotoTitleEn(e.target.value)}
                      placeholder="e.g. Presiding over 1985 Mushaira"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Photo Title (اردو عنوان)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      required
                      value={photoTitleUr}
                      onChange={(e) => setPhotoTitleUr(e.target.value)}
                      placeholder="مثلاً: صدارت قومی مشاعرہ ۱۹۸۵ء"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Archive Category
                    </label>
                    <select
                      value={photoCategory}
                      onChange={(e) => setPhotoCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                    >
                      <option value="Literary Events">Literary Events / مشاعرے</option>
                      <option value="Archives">Study & Archives / کتب خانہ</option>
                      <option value="Family Heritage">Family Heritage (Restricted) / خاندانی ورثہ</option>
                      <option value="Manuscripts">Rare Manuscripts / نایاب مسودات</option>
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
                      placeholder="e.g. 1985"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Caption / Description (English)
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

                {/* Visibility Controls */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center gap-6">
                  <span className="text-xs font-semibold text-stone-700 uppercase">Archive Visibility:</span>
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="photoVisibility"
                      checked={photoVisibility === 'public'}
                      onChange={() => setPhotoVisibility('public')}
                      className="text-amber-800"
                    />
                    <span>Public (Viewable by everyone)</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="photoVisibility"
                      checked={photoVisibility === 'restricted'}
                      onChange={() => setPhotoVisibility('restricted')}
                      className="text-amber-800"
                    />
                    <span className="text-rose-700 font-medium">Restricted (Blurred, requires Admin approval)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Photograph to Gallery</span>
                </button>
              </form>
            )}

            {/* ======================================================== */}
            {/* TAB 3: POETRY PUBLISHER (TEXT & SCANS PNG/JPEG/PDF)      */}
            {/* ======================================================== */}
            {activeTab === 'poetry' && (
              <form onSubmit={handleAddPoem} className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">Add New Poetry / کلام</h3>
                  <p className="text-xs text-stone-500">
                    Publish couplets and nazms. You can also attach an original handwritten manuscript scan or calligraphy document (PNG, JPEG, or PDF).
                  </p>
                </div>

                {/* Poetry Document / Scan Upload */}
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
                      Poem Title (English)
                    </label>
                    <input
                      type="text"
                      required
                      value={poemTitleEn}
                      onChange={(e) => setPoemTitleEn(e.target.value)}
                      placeholder="e.g. Whispers of Dawn"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Poem Title (اردو عنوان)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      required
                      value={poemTitleUr}
                      onChange={(e) => setPoemTitleUr(e.target.value)}
                      placeholder="مثلاً: سحر کی سرگوشیاں"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Urdu Verses (اردو اشعار - نستعلیق)
                  </label>
                  <textarea
                    rows={4}
                    dir="rtl"
                    required
                    value={poemVerseUr}
                    onChange={(e) => setPoemVerseUr(e.target.value)}
                    placeholder="ستاروں سے آگے جہاں اور بھی ہیں...&#10;ابھی عشق کے امتحاں اور بھی ہیں"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-base font-urdu leading-loose focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    English Translation / Commentary
                  </label>
                  <textarea
                    rows={3}
                    value={poemVerseEn}
                    onChange={(e) => setPoemVerseEn(e.target.value)}
                    placeholder="Beyond the stars, there are other worlds still..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                  />
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center gap-6">
                  <span className="text-xs font-semibold text-stone-700 uppercase">Visibility:</span>
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="poemVisibility"
                      checked={poemVisibility === 'public'}
                      onChange={() => setPoemVisibility('public')}
                      className="text-amber-800"
                    />
                    <span>Public</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="poemVisibility"
                      checked={poemVisibility === 'restricted'}
                      onChange={() => setPoemVisibility('restricted')}
                      className="text-amber-800"
                    />
                    <span className="text-rose-700 font-medium">Restricted (Requires Approval)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish Poem to Archive</span>
                </button>
              </form>
            )}

            {/* ======================================================== */}
            {/* TAB 4: BOOKS UPLOADER (FULL PDF & COVER)                 */}
            {/* ======================================================== */}
            {activeTab === 'books' && (
              <form onSubmit={handleAddBook} className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">Upload Book & Complete PDF</h3>
                  <p className="text-xs text-stone-500">
                    Add new publications to the digital library. Uploading a PDF makes the entire book readable directly on the website reader!
                  </p>
                </div>

                {/* PDF File Upload */}
                <FileUploadDropzone
                  label="1. Book PDF Document"
                  sublabel="Attach the full book PDF. It will be loaded inside the interactive book reader on the main webpage."
                  accept="application/pdf"
                  allowedExtensionsText="PDF Documents (.pdf)"
                  maxSizeMB={50}
                  value={bookPdfFile}
                  onFileSelect={(dataUrl) => setBookPdfFile(dataUrl)}
                  onClear={() => setBookPdfFile(null)}
                />

                {/* Book Cover Upload */}
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
                      Book Title (English)
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
                      Book Title (اردو عنوان)
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
                      Synopsis (English)
                    </label>
                    <textarea
                      rows={3}
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
                      rows={3}
                      dir="rtl"
                      value={bookDescUr}
                      onChange={(e) => setBookDescUr(e.target.value)}
                      placeholder="کتاب کا اجمالی جائزہ..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm font-urdu"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center gap-6">
                  <span className="text-xs font-semibold text-stone-700 uppercase">Visibility:</span>
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="bookVisibility"
                      checked={bookVisibility === 'public'}
                      onChange={() => setBookVisibility('public')}
                      className="text-amber-800"
                    />
                    <span>Public (Free to Read & Download)</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="bookVisibility"
                      checked={bookVisibility === 'restricted'}
                      onChange={() => setBookVisibility('restricted')}
                      className="text-amber-800"
                    />
                    <span className="text-rose-700 font-medium">Restricted (Approved Members Only)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish Book & Enable Online Reader</span>
                </button>
              </form>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
