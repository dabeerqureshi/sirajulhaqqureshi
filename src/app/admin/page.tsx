'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { mockAccessRequests, mockBooks, mockPoetry, mockGallery } from '@/lib/data/mockData';
import { AccessRequest, BookItem, ContentItem, GalleryItem } from '@/types/database';
import {
  Shield,
  Users,
  BookOpen,
  Feather,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Upload,
  Lock,
  Sparkles,
  Save,
  Check,
  FileText
} from 'lucide-react';

export default function AdminPage() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'requests' | 'poetry' | 'books' | 'gallery'>('requests');

  // Local state initialized with mock data
  const [requests, setRequests] = useState<AccessRequest[]>(mockAccessRequests);
  const [booksList, setBooksList] = useState<BookItem[]>(mockBooks);
  const [poetryList, setPoetryList] = useState<ContentItem[]>(mockPoetry);

  // Status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Access Request Handler (Approve / Reject)
  const handleUpdateRequest = (id: string, newStatus: 'approved' | 'rejected') => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );
    showToast(`Access request marked as ${newStatus.toUpperCase()}`);
  };

  // New Poetry Form State
  const [poemTitleEn, setPoemTitleEn] = useState('');
  const [poemTitleUr, setPoemTitleUr] = useState('');
  const [poemVerseUr, setPoemVerseUr] = useState('');
  const [poemVerseEn, setPoemVerseEn] = useState('');
  const [poemVisibility, setPoemVisibility] = useState<'public' | 'restricted'>('public');

  const handleAddPoem = (e: React.FormEvent) => {
    e.preventDefault();
    const newPoem: ContentItem = {
      id: `poetry-${Date.now()}`,
      type: 'poetry',
      title_en: poemTitleEn || 'Untitled Poem',
      title_ur: poemTitleUr || 'بلا عنوان',
      subtitle_en: 'Newly added from Admin',
      subtitle_ur: 'تازہ کلام',
      verses: [
        {
          ur: poemVerseUr || 'کوئی شعر یہاں درج نہیں کیا گیا',
          en: poemVerseEn || 'No translation provided'
        }
      ],
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
    showToast('Poem published successfully!');
  };

  // New Book Form State
  const [bookTitleEn, setBookTitleEn] = useState('');
  const [bookTitleUr, setBookTitleUr] = useState('');
  const [bookAuthorEn, setBookAuthorEn] = useState('Siraj ul Haq Qureshi');
  const [bookAuthorUr, setBookAuthorUr] = useState('سراج الحق قریشی');
  const [bookDescEn, setBookDescEn] = useState('');
  const [bookDescUr, setBookDescUr] = useState('');
  const [bookCategory, setBookCategory] = useState('Poetry');
  const [bookVisibility, setBookVisibility] = useState<'public' | 'restricted'>('public');

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const newBook: BookItem = {
      id: `book-${Date.now()}`,
      title_en: bookTitleEn || 'Untitled Book',
      title_ur: bookTitleUr || 'کتاب',
      author_en: bookAuthorEn,
      author_ur: bookAuthorUr,
      description_en: bookDescEn,
      description_ur: bookDescUr,
      category: bookCategory,
      cover_path: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800',
      file_path: '/sample-books/uploaded.pdf',
      visibility: bookVisibility,
      published: true,
      pages_count: 250,
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
    showToast('Book added to library successfully!');
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-800 text-white">
                  <Shield className="w-5 h-5" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
                  Admin CMS & Access Control
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Manage bilingual content, books, private media buckets, and approve user access requests.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Supabase Ready</span>
              </span>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-6 p-4 rounded-xl bg-stone-900 text-amber-200 text-sm font-medium shadow-lg flex items-center justify-between animate-fade-in">
              <span>{toastMessage}</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-stone-500">Pending Requests</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-700 mt-2">{pendingCount}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-stone-500">Total Books</span>
                <BookOpen className="w-4 h-4 text-stone-600" />
              </div>
              <p className="text-2xl font-bold text-stone-900 mt-2">{booksList.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-stone-500">Poetry Items</span>
                <Feather className="w-4 h-4 text-stone-600" />
              </div>
              <p className="text-2xl font-bold text-stone-900 mt-2">{poetryList.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-stone-500">Photos in Archive</span>
                <ImageIcon className="w-4 h-4 text-stone-600" />
              </div>
              <p className="text-2xl font-bold text-stone-900 mt-2">{mockGallery.length}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-stone-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
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
              onClick={() => setActiveTab('poetry')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'poetry'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Feather className="w-4 h-4" />
              <span>Publish Poetry</span>
            </button>

            <button
              onClick={() => setActiveTab('books')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'books'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Upload Book / PDF</span>
            </button>
          </div>

          {/* Tab Content Box */}
          <div className="bg-white rounded-b-2xl border-x border-b border-stone-200 p-6 sm:p-8 shadow-xs">
            {/* TAB 1: ACCESS REQUESTS APPROVAL DASHBOARD */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">User Access Requests</h3>
                  <p className="text-xs text-stone-500">
                    Review incoming requests from family members and researchers. Approving grants them access to restricted images and private manuscripts.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Applicant</th>
                        <th className="py-3 px-4">Requested Resource</th>
                        <th className="py-3 px-4">Reason for Access</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-semibold text-stone-900">{req.user_name}</p>
                            <p className="text-xs text-stone-500">{req.user_email}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-stone-100 text-stone-700 capitalize">
                              <Lock className="w-3 h-3 text-stone-500" />
                              {req.resource_type}
                            </span>
                          </td>
                          <td className="py-4 px-4 max-w-xs text-xs text-stone-600">
                            {req.reason}
                          </td>
                          <td className="py-4 px-4">
                            {req.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                            {req.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                Approved
                              </span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right space-x-2">
                            {req.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateRequest(req.id, 'approved')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateRequest(req.id, 'rejected')}
                                  className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-rose-100 hover:text-rose-700 text-stone-700 text-xs font-medium"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUpdateRequest(req.id, req.status === 'approved' ? 'rejected' : 'approved')}
                                className="text-xs text-stone-400 hover:text-stone-700 underline"
                              >
                                Change
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

            {/* TAB 2: PUBLISH POETRY FORM */}
            {activeTab === 'poetry' && (
              <form onSubmit={handleAddPoem} className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Add New Poetry / کلام</h3>
                  <p className="text-xs text-stone-500">
                    Publish couplets or nazms with both English title/translation and authentic Urdu Nastaliq script.
                  </p>
                </div>

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
                      placeholder="e.g. Dawn Reflections"
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
                    placeholder="ستاروں سے آگے جہاں اور بھی ہیں..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-base font-urdu leading-loose focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    English Translation / Poetic Interpretation
                  </label>
                  <textarea
                    rows={3}
                    value={poemVerseEn}
                    onChange={(e) => setPoemVerseEn(e.target.value)}
                    placeholder="Beyond the stars, there are other worlds still..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-700/30"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <span className="text-xs font-semibold text-stone-700 uppercase">Visibility:</span>
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="poemVisibility"
                      checked={poemVisibility === 'public'}
                      onChange={() => setPoemVisibility('public')}
                      className="text-amber-800 focus:ring-amber-800"
                    />
                    <span>Public (Everyone)</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="poemVisibility"
                      checked={poemVisibility === 'restricted'}
                      onChange={() => setPoemVisibility('restricted')}
                      className="text-amber-800 focus:ring-amber-800"
                    />
                    <span>Restricted (Requires Approval)</span>
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

            {/* TAB 3: UPLOAD BOOK FORM */}
            {activeTab === 'books' && (
              <form onSubmit={handleAddBook} className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Upload Book or Manuscript</h3>
                  <p className="text-xs text-stone-500">
                    Add new publications to the digital library with bilingual titles, synopsis, and PDF attachment.
                  </p>
                </div>

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
                      placeholder="مثلاً کلیاتِ سراج"
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
                      Category
                    </label>
                    <select
                      value={bookCategory}
                      onChange={(e) => setBookCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                    >
                      <option value="Poetry">Poetry</option>
                      <option value="Philosophy">Philosophy</option>
                      <option value="Memoirs">Memoirs</option>
                      <option value="Literary Essays">Literary Essays</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Description (English)
                    </label>
                    <textarea
                      rows={3}
                      value={bookDescEn}
                      onChange={(e) => setBookDescEn(e.target.value)}
                      placeholder="Brief overview of the book contents..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                      Description (اردو تعارف)
                    </label>
                    <textarea
                      rows={3}
                      dir="rtl"
                      value={bookDescUr}
                      onChange={(e) => setBookDescUr(e.target.value)}
                      placeholder="کتاب کا مختصر تعارف..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-urdu"
                    />
                  </div>
                </div>

                {/* PDF & Cover Upload Area */}
                <div className="p-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-amber-800" />
                    <div>
                      <p className="text-sm font-semibold text-stone-800">Attach Book Document / PDF</p>
                      <p className="text-xs text-stone-500">Supports PDF up to 50MB (Uploads to Supabase Storage)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('PDF uploader connected to Supabase Storage bucket')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select PDF</span>
                  </button>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <span className="text-xs font-semibold text-stone-700 uppercase">Visibility:</span>
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="bookVisibility"
                      checked={bookVisibility === 'public'}
                      onChange={() => setBookVisibility('public')}
                      className="text-amber-800"
                    />
                    <span>Public (Free Download)</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="bookVisibility"
                      checked={bookVisibility === 'restricted'}
                      onChange={() => setBookVisibility('restricted')}
                      className="text-amber-800"
                    />
                    <span>Restricted (Approved Users Only)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Book to Archive</span>
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
