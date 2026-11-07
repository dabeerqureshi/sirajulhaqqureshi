/**
 * Client helper to translate text between English and Urdu using the server /api/translate route.
 */
export async function translateText(
  text: string,
  to?: 'en' | 'ur',
  from?: 'en' | 'ur' | 'auto'
): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, to, from }),
    });

    if (!res.ok) {
      return clean;
    }

    const data = await res.json().catch(() => null);
    return data?.translatedText || clean;
  } catch (err) {
    console.warn('Translation request failed:', err);
    return clean;
  }
}

/**
 * Given a pair of English and Urdu inputs, if one is provided and the other is empty,
 * automatically translates the provided string to populate the empty one.
 */
export async function autoTranslatePair(
  en: string | null | undefined,
  ur: string | null | undefined
): Promise<{ en: string; ur: string }> {
  const cleanEn = (en || '').trim();
  const cleanUr = (ur || '').trim();

  // If both are filled, keep them
  if (cleanEn && cleanUr) {
    return { en: cleanEn, ur: cleanUr };
  }

  // If English is provided, translate to Urdu
  if (cleanEn && !cleanUr) {
    const translatedUr = await translateText(cleanEn, 'ur', 'en');
    return { en: cleanEn, ur: translatedUr || cleanEn };
  }

  // If Urdu is provided, translate to English
  if (!cleanEn && cleanUr) {
    const translatedEn = await translateText(cleanUr, 'en', 'ur');
    return { en: translatedEn || cleanUr, ur: cleanUr };
  }

  return { en: '', ur: '' };
}
