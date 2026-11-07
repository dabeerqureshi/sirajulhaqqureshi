import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Detect whether text is predominantly Urdu/Arabic script or English/Latin.
 */
function isUrduScript(text: string): boolean {
  const urduCharRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return urduCharRegex.test(text);
}

/**
 * POST /api/translate
 * Body: { text: string, from?: string, to?: string }
 * Translates text between English and Urdu (bidirectional).
 * If target `to` is not supplied, it automatically detects the input language
 * and translates to the other (Urdu -> English, English -> Urdu).
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`translate_${ip}`, {
      maxRequests: 30,
      windowMs: 60_000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Translation rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'Missing text to translate' }, { status: 400 });
    }

    const cleanText = body.text.trim();
    if (!cleanText) {
      return NextResponse.json({ translatedText: '' });
    }

    // Determine target languages
    let from = typeof body.from === 'string' && body.from ? body.from : 'auto';
    let to = typeof body.to === 'string' && body.to ? body.to : '';

    if (!to) {
      // Auto-detect direction
      if (isUrduScript(cleanText)) {
        from = 'ur';
        to = 'en';
      } else {
        from = 'en';
        to = 'ur';
      }
    }

    let translated = '';

    // Primary: Google Translate GTX endpoint (fast, free, handles Urdu Nastaliq & English well)
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(cleanText)}`;
      const res = await fetch(gtxUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && Array.isArray(json[0])) {
          translated = json[0]
            .map((chunk: [string | null]) => (Array.isArray(chunk) && chunk[0] ? chunk[0] : ''))
            .join('');
        }
      }
    } catch (googleErr) {
      console.warn('Google translation fetch failed, trying MyMemory:', googleErr);
    }

    // Secondary fallback: MyMemory API
    if (!translated.trim()) {
      try {
        const langpair = `${from === 'auto' ? (isUrduScript(cleanText) ? 'ur' : 'en') : from}|${to}`;
        const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${langpair}`;
        const res = await fetch(myMemoryUrl);
        if (res.ok) {
          const json = await res.json();
          if (json?.responseData?.translatedText) {
            translated = json.responseData.translatedText;
          }
        }
      } catch (mmErr) {
        console.warn('MyMemory translation fetch failed:', mmErr);
      }
    }

    // Final fallback: return original clean text if translation servers couldn't be reached
    if (!translated.trim()) {
      translated = cleanText;
    }

    return NextResponse.json({
      translatedText: translated.trim(),
      from,
      to,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Translation error' },
      { status: 500 }
    );
  }
}
