export type UserRole = 'admin' | 'approved_user' | 'user';
export type Visibility = 'public' | 'restricted';
export type ContentType = 'intro' | 'biography' | 'poetry' | 'article' | 'memory';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type ResourceType = 'all' | 'gallery' | 'books' | 'poetry';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PoetryVerse {
  ur: string;
  en?: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title_en: string;
  title_ur: string;
  subtitle_en?: string | null;
  subtitle_ur?: string | null;
  body_en?: string | null;
  body_ur?: string | null;
  verses?: PoetryVerse[] | null;
  cover_image?: string | null;
  visibility: Visibility;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookItem {
  id: string;
  title_en: string;
  title_ur: string;
  author_en: string;
  author_ur: string;
  description_en?: string | null;
  description_ur?: string | null;
  category?: string;
  cover_path?: string | null;
  file_path?: string | null;
  visibility: Visibility;
  published: boolean;
  pages_count?: number | null;
  published_year?: string | null;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  title_en: string;
  title_ur: string;
  description_en?: string | null;
  description_ur?: string | null;
  category?: string;
  file_path: string;
  visibility: Visibility;
  sort_order: number;
  taken_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  resource_type: ResourceType;
  resource_id?: string | null;
  reason: string;
  status: RequestStatus;
  admin_notes?: string | null;
  requested_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}
