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
  cover_image: '/gallery/siraj-profile.jpg',
  visibility: 'public',
  published: true,
  sort_order: 2,
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z'
};

export const mockPoetry: ContentItem[] = [];

export const mockBooks: BookItem[] = [];

export const mockGallery: GalleryItem[] = [];

export const mockAccessRequests: AccessRequest[] = [];
