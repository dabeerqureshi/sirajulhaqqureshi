import { ContentItem, BookItem, GalleryItem, AccessRequest } from '@/types/database';

export const mockIntro: ContentItem = {
  id: 'intro-1',
  type: 'intro',
  title_en: 'Siraj ul Haq Qureshi',
  title_ur: 'سراج الحق قریشی',
  subtitle_en: 'Literary Icon, Thinker, Poet & Scholar',
  subtitle_ur: 'ادیب، مفکر، شاعر اور دانشور',
  body_en: 'Welcome to the digital archive and repository of Siraj ul Haq Qureshi. A celebrated literary figure whose life and works span decades of intellectual pursuit, poetic brilliance, and profound scholarly contributions. Here you will discover his published books, timeless poetry in Urdu and English, archival photographs, and reflections.',
  body_ur: 'سراج الحق قریشی کے ڈیجیٹل آرکائیو اور ادبی ورثے میں خوش آمدید۔ ایک ایسی باوقار شخصیت جنہوں نے اپنی زندگی کو فکرو دانش، شعر و ادب اور علمی خدمات کے لیے وقف کیا۔ یہاں آپ ان کی تصانیف، اردو اور انگریزی شاعری، تاریخی تصاویر اور نایاب ادبی نگارشات کا مطالعہ کر سکتے ہیں۔',
  cover_image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200',
  visibility: 'public',
  published: true,
  sort_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockBiography: ContentItem = {
  id: 'bio-1',
  type: 'biography',
  title_en: 'The Life & Intellectual Journey',
  title_ur: 'حیات اور فکری سفر',
  subtitle_en: 'A lifetime devoted to literature, ethics, and intellectual enlightenment',
  subtitle_ur: 'ادب، اخلاقیات اور فکری بیداری کے لیے وقف ایک تابناک حیات',
  body_en: 'Siraj ul Haq Qureshi was distinguished by his profound commitment to cultural renaissance and literary eloquence. Born with an innate passion for words, his journey was shaped by rigorous classical study alongside an acute awareness of modern human dilemmas. Through his prose and poetry, he voiced moral resonance, societal conscience, and spiritual elevation.',
  body_ur: 'سراج الحق قریشی کی زندگی ادبی وقار اور فکری جستجو کا ایک روشن باب ہے۔ انہوں نے روایتی کلاسیکی شعور کو عصری مسائل کے ساتھ ملا کر ایک منفرد اسلوب بخشا۔ ان کی تحریریں اور شاعری دلوں کو چھو لینے والے احساسات، اخلاقی شعور اور روحانی بیداری کا مرقع ہیں۔',
  cover_image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200',
  visibility: 'public',
  published: true,
  sort_order: 2,
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z'
};

export const mockPoetry: ContentItem[] = [
  {
    id: 'poetry-1',
    type: 'poetry',
    title_en: 'Whispers of Dawn (سحر کی سرگوشیاں)',
    title_ur: 'سحر کی سرگوشیاں',
    subtitle_en: 'Reflections on hope, awakening, and truth',
    subtitle_ur: 'امید، آگہی اور حق کے موضوع پر ایک شاہکار نظم',
    verses: [
      {
        ur: 'ستاروں سے آگے جہاں اور بھی ہیں\nابھی عشق کے امتحاں اور بھی ہیں',
        en: 'Beyond the stars, there are other worlds still;\nThere are more trials awaiting passion and will.'
      },
      {
        ur: 'قناعت نہ کر عالم رنگ و بو پر\nچمن اور بھی، آشیاں اور بھی ہیں',
        en: 'Be not content with this transient realm of scent and hue;\nThere are other gardens, other sanctuaries awaiting you.'
      },
      {
        ur: 'اگر کھو گیا اک نشیمن تو کیا غم\nمقاماتِ آہ و فغاں اور بھی ہیں',
        en: 'If one dwelling is lost, why grieve or despair?\nOther horizons and heights await your prayer.'
      }
    ],
    cover_image: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&q=80&w=800',
    visibility: 'public',
    published: true,
    sort_order: 1,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  },
  {
    id: 'poetry-2',
    type: 'poetry',
    title_en: 'The Eternal Torch (چراغِ آرزو)',
    title_ur: 'چراغِ آرزو',
    subtitle_en: 'A tribute to seekers of wisdom and spiritual depth',
    subtitle_ur: 'حکمت اور روحانی تلاش کے متلاشیوں کے نام نذرانہ',
    verses: [
      {
        ur: 'اندھیروں میں جلا کے دل کا دیا چلے ہیں\nہم راہِ حق پہ بے خوف و فغاں چلے ہیں',
        en: 'Kindling the heart’s lamp through darkness we proceed;\nAlong the path of truth, fearless in word and deed.'
      },
      {
        ur: 'نہ کوئی طلبِ شہرت نہ خوفِ زوال ہے\nہم تو فقط پیامِ محبت سنا چلے ہیں',
        en: 'No yearning for fame, no fear of decay or fall;\nOnly a message of universal love do we bestow to all.'
      }
    ],
    cover_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800',
    visibility: 'public',
    published: true,
    sort_order: 2,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'poetry-3',
    type: 'poetry',
    title_en: 'Intimate Verses (خلوت کے اشعار)',
    title_ur: 'خلوت کے اشعار',
    subtitle_en: 'Restricted Collection — Private Meditations',
    subtitle_ur: 'نجی مجموعہ — مخصوص احباب کے لیے',
    verses: [
      {
        ur: 'رازِ نہاں جو سینے میں موجزن رہا\nوہ حرفِ دعا بن کے لبوں پر عیاں ہوا',
        en: 'The guarded secret that surged within the chest;\nBecame a whispered prayer, on faithful lips confessed.'
      }
    ],
    cover_image: 'https://images.unsplash.com/photo-1507842229451-79b1be88688e?auto=format&fit=crop&q=80&w=800',
    visibility: 'restricted',
    published: true,
    sort_order: 3,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z'
  }
];

export const mockBooks: BookItem[] = [
  {
    id: 'book-1',
    title_en: 'Kulliyat-e-Siraj (Collected Works)',
    title_ur: 'کلیاتِ سراج',
    author_en: 'Siraj ul Haq Qureshi',
    author_ur: 'سراج الحق قریشی',
    description_en: 'A monumental collection bringing together over four decades of celebrated poetry, nazms, and ghazals with literary commentary.',
    description_ur: 'چار دہائیوں پر محیط غزلیات، منظومات اور شعری شہپاروں کا نایاب اور جامع مجموعہ مع ادبی حواشی۔',
    category: 'Poetry',
    cover_path: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
    file_path: '/sample-books/kulliyat-e-siraj.pdf',
    visibility: 'public',
    published: true,
    pages_count: 420,
    published_year: '1998',
    download_count: 1420,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z'
  },
  {
    id: 'book-2',
    title_en: 'Afkar-e-Danish (Philosophical Essays)',
    title_ur: 'افکارِ دانش',
    author_en: 'Siraj ul Haq Qureshi',
    author_ur: 'سراج الحق قریشی',
    description_en: 'A profound exploration of Eastern philosophy, ethics, societal renewal, and human intellect.',
    description_ur: 'مشرقی فلسفہ، اخلاقی اقدار، معاشرتی بیداری اور فکری اساس پر مبنی علمی و فکری مضامین کا شاہکار۔',
    category: 'Philosophy',
    cover_path: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
    file_path: '/sample-books/afkar-e-danish.pdf',
    visibility: 'public',
    published: true,
    pages_count: 310,
    published_year: '2004',
    download_count: 890,
    created_at: '2024-01-08T00:00:00Z',
    updated_at: '2024-01-08T00:00:00Z'
  },
  {
    id: 'book-3',
    title_en: 'Private Memoirs & Unreleased Letters',
    title_ur: 'یادداشتیں اور غیر مطبوعہ خطوط',
    author_en: 'Siraj ul Haq Qureshi',
    author_ur: 'سراج الحق قریشی',
    description_en: 'Rare historical manuscripts, personal correspondence with leading literary luminaries, and family chronicles.',
    description_ur: 'نایاب تاریخی قلمی نسخے، معاصر اہل قلم کے ساتھ خط و کتابت اور خاندانی روایات کا دستاویزی ریکارڈ۔',
    category: 'Memoirs',
    cover_path: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800',
    file_path: '/restricted-books/memoirs.pdf',
    visibility: 'restricted',
    published: true,
    pages_count: 180,
    published_year: '2012',
    download_count: 95,
    created_at: '2024-01-12T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z'
  }
];

export const mockGallery: GalleryItem[] = [
  {
    id: 'photo-1',
    title_en: 'National Mushaira 1985',
    title_ur: 'قومی مشاعرہ ۱۹۸۵ء',
    description_en: 'Presiding over the historic literary assembly alongside prominent poets.',
    description_ur: 'معروف شعرا اور ادبا کے ہمراہ مشاعرے کی صدارت کا یادگار لمحہ۔',
    category: 'Literary Events',
    file_path: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
    visibility: 'public',
    sort_order: 1,
    taken_date: '1985',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'photo-2',
    title_en: 'Study & Library Archives',
    title_ur: 'مطالعہ گاہ اور کتب خانہ',
    description_en: 'Surrounded by classical manuscripts and historical references.',
    description_ur: 'نایاب قلمی نسخوں اور تاریخی کتب سے آراستہ ذاتی کتب خانہ۔',
    category: 'Archives',
    file_path: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',
    visibility: 'public',
    sort_order: 2,
    taken_date: '1992',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'photo-3',
    title_en: 'Book Inauguration Ceremony',
    title_ur: 'تقریب رونمائی کتب',
    description_en: 'Distinguished scholars gathering for the release of his collected works.',
    description_ur: 'علمی و ادبی شخصیات کی موجودگی میں تصنیف کی باوقار تقریب رونمائی۔',
    category: 'Literary Events',
    file_path: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
    visibility: 'public',
    sort_order: 3,
    taken_date: '1998',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  },
  {
    id: 'photo-4',
    title_en: 'Restricted Family Heritage & Ancestral Portraits',
    title_ur: 'خاندانی تصاویر اور نایاب ورثہ',
    description_en: 'Restricted Collection: Exclusive access for family members and authorized researchers.',
    description_ur: 'مخصوص کلیکشن: صرف منظور شدہ خاندانی افراد اور محققین کے لیے دستیاب۔',
    category: 'Family Heritage',
    file_path: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800',
    visibility: 'restricted',
    sort_order: 4,
    taken_date: '1970',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  },
  {
    id: 'photo-5',
    title_en: 'Private Handwritten Manuscripts',
    title_ur: 'غیر مطبوعہ قلمی مسودات',
    description_en: 'Restricted: Rare drafts and private diary entries.',
    description_ur: 'مخصوص رسائی: نایاب تحریری مسودات اور ذاتی یادداشتیں۔',
    category: 'Manuscripts',
    file_path: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800',
    visibility: 'restricted',
    sort_order: 5,
    taken_date: '1981',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z'
  }
];

export const mockAccessRequests: AccessRequest[] = [
  {
    id: 'req-1',
    user_id: 'user-101',
    user_name: 'Muhammad Tariq',
    user_email: 'tariq.scholar@univ.edu',
    resource_type: 'gallery',
    reason: 'Conducting academic research on 20th-century South Asian literary gatherings and would like access to restricted photo archives.',
    status: 'pending',
    requested_at: '2024-02-10T14:30:00Z'
  },
  {
    id: 'req-2',
    user_id: 'user-102',
    user_name: 'Fatima Zahra Qureshi',
    user_email: 'fatima.q@gmail.com',
    resource_type: 'all',
    reason: 'Granddaughter of Siraj ul Haq Qureshi requesting access to private family archives and unpublished manuscripts.',
    status: 'pending',
    requested_at: '2024-02-12T09:15:00Z'
  },
  {
    id: 'req-3',
    user_id: 'user-103',
    user_name: 'Dr. Asad Rizvi',
    user_email: 'asad.rizvi@heritage.org',
    resource_type: 'books',
    reason: 'Compiling an annotated bibliography of Urdu philosophical treatises.',
    status: 'approved',
    requested_at: '2024-01-28T11:00:00Z',
    reviewed_at: '2024-01-29T16:20:00Z'
  }
];
