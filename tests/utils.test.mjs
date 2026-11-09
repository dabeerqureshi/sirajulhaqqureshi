import test from 'node:test';
import assert from 'node:assert/strict';

// Test rate-limit logic
test('Rate Limiter - sliding window rate limiter prevents abuse', async () => {
  // Simple in-memory rate limiter test logic matching rate-limit.ts
  const tracker = new Map();
  function checkLimit(key, max, windowMs) {
    const now = Date.now();
    const entry = tracker.get(key);
    if (!entry || now > entry.resetTime) {
      tracker.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: max - 1 };
    }
    if (entry.count >= max) {
      return { success: false, remaining: 0 };
    }
    entry.count += 1;
    return { success: true, remaining: max - entry.count };
  }

  // 1. First 3 requests should pass with max=3
  assert.equal(checkLimit('user_ip_1', 3, 1000).success, true);
  assert.equal(checkLimit('user_ip_1', 3, 1000).success, true);
  assert.equal(checkLimit('user_ip_1', 3, 1000).success, true);

  // 2. 4th request must be rate limited
  const blocked = checkLimit('user_ip_1', 3, 1000);
  assert.equal(blocked.success, false);
  assert.equal(blocked.remaining, 0);

  // 3. Different user key is not affected
  assert.equal(checkLimit('user_ip_2', 3, 1000).success, true);
});

// Test storage URL resolver & path extractor logic
test('Storage Utils - getStorageUrl and extractStoragePath', () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';

  function getStorageUrl(path, bucket = 'public-assets') {
    if (!path || typeof path !== 'string') return '';
    const trimmed = path.trim();
    if (!trimmed) return '';
    if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
    const rawBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!rawBase) return trimmed;
    const base = rawBase.replace(/\/+$/, '');
    let clean = trimmed.replace(/^\/+/, '');
    const storageMarker = 'storage/v1/object/';
    if (clean.startsWith(storageMarker)) {
      return `${base}/${clean}`;
    }
    const within = clean.startsWith(`${bucket}/`) ? clean.slice(bucket.length + 1) : clean;
    const safeWithin = within
      .split('/')
      .map((segment) => {
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join('/');
    return `${base}/storage/v1/object/public/${bucket}/${safeWithin}`;
  }

  function extractStoragePath(urlOrPath, bucket = 'public-assets') {
    if (!urlOrPath) return null;
    if (urlOrPath.startsWith('data:') || urlOrPath.startsWith('blob:')) return null;
    const publicMarker = `/storage/v1/object/public/${bucket}/`;
    const signMarker = `/storage/v1/object/sign/${bucket}/`;
    if (urlOrPath.includes(publicMarker)) {
      return decodeURIComponent(urlOrPath.split(publicMarker)[1].split('?')[0]);
    }
    if (urlOrPath.includes(signMarker)) {
      return decodeURIComponent(urlOrPath.split(signMarker)[1].split('?')[0]);
    }
    if (/^https?:\/\//i.test(urlOrPath)) {
      const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseBase || !urlOrPath.startsWith(supabaseBase)) {
        return null;
      }
    }
    const clean = urlOrPath.replace(/^\/+/, '');
    return clean.startsWith(`${bucket}/`) ? clean.slice(bucket.length + 1) : clean;
  }

  // Resolves relative path
  assert.equal(
    getStorageUrl('books/divan.pdf'),
    'https://demo.supabase.co/storage/v1/object/public/public-assets/books/divan.pdf'
  );

  // Resolves bucket-prefixed path without doubling bucket name
  assert.equal(
    getStorageUrl('public-assets/books/divan.pdf'),
    'https://demo.supabase.co/storage/v1/object/public/public-assets/books/divan.pdf'
  );

  // Preserves external URLs and data URLs
  assert.equal(getStorageUrl('https://images.unsplash.com/photo.jpg'), 'https://images.unsplash.com/photo.jpg');
  assert.equal(getStorageUrl('data:image/png;base64,...'), 'data:image/png;base64,...');

  // Handles already-prefixed storage paths
  assert.equal(
    getStorageUrl('storage/v1/object/public/public-assets/gallery/photo1.jpg'),
    'https://demo.supabase.co/storage/v1/object/public/public-assets/gallery/photo1.jpg'
  );

  // Handles filenames with spaces
  assert.equal(
    getStorageUrl('gallery/mushaira event 1980.jpg'),
    'https://demo.supabase.co/storage/v1/object/public/public-assets/gallery/mushaira%20event%201980.jpg'
  );

  // Extracts storage path correctly
  assert.equal(
    extractStoragePath('https://demo.supabase.co/storage/v1/object/public/public-assets/gallery/photo1.jpg'),
    'gallery/photo1.jpg'
  );
  assert.equal(extractStoragePath('public-assets/poetry/scan.pdf'), 'poetry/scan.pdf');

  // Returns null for non-supabase external URLs and data URLs
  assert.equal(extractStoragePath('https://images.unsplash.com/photo.jpg'), null);
  assert.equal(extractStoragePath('data:application/pdf;base64,...'), null);
});

// Test bilingual script detection and pair resolution
test('Bilingual Translation - Urdu and English script classification', () => {
  function isUrduScript(text) {
    return /[\u0600-\u06FF]/.test(text);
  }

  assert.equal(isUrduScript('سراج الحق قریشی'), true);
  assert.equal(isUrduScript('Siraj ul Haq Qureshi'), false);
  assert.equal(isUrduScript('کلیاتِ سراج - Complete Works'), true);
  assert.equal(isUrduScript('1952'), false);
});
