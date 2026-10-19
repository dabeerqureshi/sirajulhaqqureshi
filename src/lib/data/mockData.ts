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
  cover_image: '/gallery/siraj-profile.jpg',
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
    id: 'siraj-04',
    title_en: 'Formal Portrait',
    title_ur: 'باوقار تصویر',
    description_en: 'A distinguished portrait — dressed in a fine suit and traditional cap.',
    description_ur: 'باوقار انداز میں سوٹ اور روایتی ٹوپی پہنے ہوئے ایک شاندار تصویر۔',
    category: 'Personal Life',
    file_path: '/gallery/siraj-04.jpg',
    visibility: 'public',
    sort_order: 1,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-13',
    title_en: 'With Scholars & Dignitaries',
    title_ur: 'علماء و دانشوروں کے ساتھ',
    description_en: 'In consultation with distinguished scholars during an official visit.',
    description_ur: 'سرکاری دورے کے دورین علماء و دانشوروں کے ساتھ مشاورت۔',
    category: 'Literary Events',
    file_path: '/gallery/siraj-13.jpg',
    visibility: 'public',
    sort_order: 2,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-08',
    title_en: 'Warm Felicitations',
    title_ur: 'تقریب پر دلی ملاقات',
    description_en: 'A warm embrace with a well-wisher at a family ceremony.',
    description_ur: 'خاندانی تقریب پر ایک اپنوں سے گلے ملنے کا گرم لمحہ۔',
    category: 'Ceremonies',
    file_path: '/gallery/siraj-08.jpg',
    visibility: 'public',
    sort_order: 3,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-07',
    title_en: 'Family in Dua',
    title_ur: 'خاندان کی دعا',
    description_en: 'Family members raising their hands in supplication at a decorated gathering.',
    description_ur: 'آراستہ تقریب میں خاندان کے افراد کو دعا کے لیے ہاتھ اٹھاتے ہوئے۔',
    category: 'Ceremonies',
    file_path: '/gallery/siraj-07.jpg',
    visibility: 'public',
    sort_order: 4,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-10',
    title_en: 'Three Generations',
    title_ur: 'تین نسلیں، ایک تصویر',
    description_en: 'Three generations of the family together under one roof.',
    description_ur: 'ایک ہی چھت کے نیچے خاندان کی تین نسلیں ایک ساتھ۔',
    category: 'Family Life',
    file_path: '/gallery/siraj-10.jpg',
    visibility: 'public',
    sort_order: 5,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-12',
    title_en: 'Graduation Day Portrait',
    title_ur: 'کامیابی کے دن خاندانی تصویر',
    description_en: 'A framed family portrait from a graduation celebration at St Mary’s University.',
    description_ur: 'سینٹ میریز یونیورسٹی کی گریجویشن تقریب کی یاد میں قیمی خاندانی تصویر۔',
    category: 'Family Life',
    file_path: '/gallery/siraj-12.jpg',
    visibility: 'public',
    sort_order: 6,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-01',
    title_en: 'A Casual Afternoon',
    title_ur: 'سادہ سا دورانہ',
    description_en: 'A candid moment of relaxation during an everyday outing.',
    description_ur: 'روزمرہ سفر کے دوران راحت کا ایک بے تکلفانہ لمحہ۔',
    category: 'Personal Life',
    file_path: '/gallery/siraj-01.jpg',
    visibility: 'public',
    sort_order: 7,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-02',
    title_en: 'With His Grandson',
    title_ur: 'پوٹھے کے ساتھ',
    description_en: 'Sharing a proud moment with his grandson after an achievement.',
    description_ur: 'کامیابی کے بعد پوٹھے کے ساتھ فخر کا لمحہ۔',
    category: 'Family Life',
    file_path: '/gallery/siraj-02.jpg',
    visibility: 'public',
    sort_order: 8,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-03',
    title_en: 'An Evening at Home',
    title_ur: 'گھر کی ایک شام',
    description_en: 'A quiet evening at home in the company of family.',
    description_ur: 'خاندان کے ساتھ گزاری ہوئے ایک پرسکون شام۔',
    category: 'Family Life',
    file_path: '/gallery/siraj-03.jpg',
    visibility: 'public',
    sort_order: 9,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-05',
    title_en: 'At the National Championship',
    title_ur: 'قومی چیمپئن شپ میں',
    description_en: 'Cheering for the next generation at the National Basketball Championship.',
    description_ur: 'قومی باسکٹ بال چیمپئن شپ میں آئندہ نسل کی حوصلہ افزائی۔',
    category: 'Public Events',
    file_path: '/gallery/siraj-05.jpg',
    visibility: 'public',
    sort_order: 10,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-09',
    title_en: 'At Home with Family',
    title_ur: 'گھر پر خاندان کے ساتھ',
    description_en: 'A relaxed moment at home with the younger generation.',
    description_ur: 'نئی نسل کے ساتھ گھر پر ایک پرسکون لمحہ۔',
    category: 'Family Life',
    file_path: '/gallery/siraj-09.jpg',
    visibility: 'public',
    sort_order: 11,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-14',
    title_en: 'Greetings at the Ceremony',
    title_ur: 'تقریب پر گلے ملانا',
    description_en: 'Embracing a guest with affection at a family ceremony.',
    description_ur: 'خاندانی تقریب پر مہمان کو محبت سے گلے لگاتے ہوئے۔',
    category: 'Ceremonies',
    file_path: '/gallery/siraj-14.jpg',
    visibility: 'public',
    sort_order: 12,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-15',
    title_en: 'Collective Dua',
    title_ur: 'گروہی دعا',
    description_en: 'Family and friends supplicating together at a decorated venue.',
    description_ur: 'آراستہ جگہ پر خاندان اور دوستوں کی مشترکہ دعا۔',
    category: 'Ceremonies',
    file_path: '/gallery/siraj-15.jpg',
    visibility: 'public',
    sort_order: 13,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-16',
    title_en: 'At the University Honoring Ceremony',
    title_ur: 'یونیورسٹی کی اعزازی تقریب میں',
    description_en: 'Accompanying the younger generation at the university honouring ceremony.',
    description_ur: 'یونیورسٹی کی اعزازی تقریب میں نئی نسل کی رہنمائی۔',
    category: 'Public Events',
    file_path: '/gallery/siraj-16.jpg',
    visibility: 'public',
    sort_order: 14,
    taken_date: '28 Oct 2022',
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-17',
    title_en: 'A Proud Moment',
    title_ur: 'فخر کا لمحہ',
    description_en: 'Standing proudly beside the medal winner at the university ceremony.',
    description_ur: 'یونیورسٹی تقریب میں میڈل وینر کے ساتھ فخر سے کھڑے ہوئے۔',
    category: 'Public Events',
    file_path: '/gallery/siraj-17.jpg',
    visibility: 'public',
    sort_order: 15,
    taken_date: '28 Oct 2022',
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-18',
    title_en: 'Medal Distribution Ceremony 2022',
    title_ur: 'میڈل تقسیم کی تقریب ۲۰۲۲',
    description_en: 'Medal Distribution Ceremony at the National University, Islamabad — 28 October 2022.',
    description_ur: 'نیشنل یونیورسٹی اسلام آباد میں میڈل تقسیم کی تقریب — ۲۸ اکتوبر ۲۰۲۲۔',
    category: 'Public Events',
    file_path: '/gallery/siraj-18.jpg',
    visibility: 'public',
    sort_order: 16,
    taken_date: '28 Oct 2022',
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-19',
    title_en: 'Family at the Wedding',
    title_ur: 'شادی کی تقریب پر خاندان',
    description_en: 'Family gathered around the groom to offer blessings.',
    description_ur: 'دولہے کو دعائیں دیتے ہوئے خاندان کے افراد کا اجتماع۔',
    category: 'Ceremonies',
    file_path: '/gallery/siraj-19.jpg',
    visibility: 'public',
    sort_order: 17,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-20',
    title_en: 'Wedding Group Photo',
    title_ur: 'شادی کا گروپ فوٹو',
    description_en: 'A joint family photograph on the wedding night with the groom.',
    description_ur: 'شادی کی رات دولہے کے ساتھ خاندانی جماعتی تصویر۔',
    category: 'Ceremonies',
    file_path: '/gallery/siraj-20.jpg',
    visibility: 'public',
    sort_order: 18,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-21',
    title_en: 'Celebrating the Wedding',
    title_ur: 'شادی کی خوشیوں میں',
    description_en: 'Garlands and smiles — celebrating a family wedding together.',
    description_ur: 'گلابوں کے ہار اور مسکراہٹیں — خاندان کی شادی کی خوشی مناتے ہوئے۔',
    category: 'Ceremonies',
    file_path: '/gallery/siraj-21.jpg',
    visibility: 'public',
    sort_order: 19,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-22',
    title_en: 'At the Pak-China Friendship Cup',
    title_ur: 'پاک چین دوستی کپ میں',
    description_en: 'At the Pak-China Friendship Cup 3x3 Championship, Islamabad.',
    description_ur: 'اسلام آباد میں پاک چین دوستی کپ ۳x۳ چیمپئن شپ کے دوران۔',
    category: 'Public Events',
    file_path: '/gallery/siraj-22.jpg',
    visibility: 'public',
    sort_order: 20,
    taken_date: '2026',
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-23',
    title_en: 'At the Championship Banner',
    title_ur: 'چیمپئن شپ بینر کے ساتھ',
    description_en: 'Posing before the championship banner at the Pakistan Sports Complex.',
    description_ur: 'پاکستان سپورٹس کامپلیکس میں چیمپئن شپ بینر کے ساتھ۔',
    category: 'Public Events',
    file_path: '/gallery/siraj-23.jpg',
    visibility: 'public',
    sort_order: 21,
    taken_date: '2026',
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-24',
    title_en: 'Between the Friendship Flags',
    title_ur: 'دوستی کے جھنڈوں کے ساتھ',
    description_en: 'Between the flags of Pakistan and China at the friendship event.',
    description_ur: 'دوستی کے تقریب میں پاکستان اور چین کے جھنڈوں کے درمیان۔',
    category: 'Public Events',
    file_path: '/gallery/siraj-24.jpg',
    visibility: 'public',
    sort_order: 22,
    taken_date: '2026',
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-25',
    title_en: 'Alongside Dignitaries',
    title_ur: 'سینیئر شخصیات کے ساتھ',
    description_en: 'Alongside officials and dignitaries at the Pak-China Friendship Cup.',
    description_ur: 'پاک چین دوستی کپ میں اہل اداروں اور سینیئر شخصیات کے ساتھ۔',
    category: 'Public Events',
    file_path: '/gallery/siraj-25.jpg',
    visibility: 'public',
    sort_order: 23,
    taken_date: '2026',
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-06',
    title_en: 'In Memoriam Announcement',
    title_ur: 'یاد میں اعلان',
    description_en: 'A commemorative announcement honouring his blessed memory.',
    description_ur: 'مبارک یادگاری کے حوالے سے تحریری اعلان۔',
    category: 'In Memoriam',
    file_path: '/gallery/siraj-06.jpg',
    visibility: 'public',
    sort_order: 24,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'siraj-11',
    title_en: 'Neighbourhood Street View',
    title_ur: 'محلے کا منظر',
    description_en: 'Everyday scenes from the family neighbourhood.',
    description_ur: 'خاندانی محلے کے روزمرہ مناظر۔',
    category: 'Personal Life',
    file_path: '/gallery/siraj-11.jpg',
    visibility: 'public',
    sort_order: 25,
    created_at: '2026-10-16T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
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
    sort_order: 26,
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
    sort_order: 27,
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
