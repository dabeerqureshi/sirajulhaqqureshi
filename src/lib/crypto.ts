/**
 * CLIENT-SIDE ENCRYPTION LAYER (Web Crypto API)
 *
 * Security model:
 *  - AES-GCM encryption with a 256-bit key derived from a user-supplied password
 *  - Key derivation: PBKDF2-HMAC-SHA256 with 100,000 iterations and a random salt
 *  - The password / derived key NEVER leaves the browser. It is never sent to Supabase.
 *  - The salt is stored alongside the file (not secret by itself); the password is the secret.
 *  - If the password is lost, the ciphertext is cryptographically unrecoverable.
 *
 * Usage (upload):
 *   const { encrypted, salt, iv } = await encryptFile(file, password);
 *   // upload `encrypted` bytes to Supabase Storage; save `salt` (and `iv` if not prepended) in DB
 *
 * Usage (download/view):
 *   const decrypted = await decryptFile(encryptedBytes, password, salt, iv);
 *   // create a blob URL and play/show it
 */

const ALGORITHM = 'AES-GCM';
const KEY_BITS = 256;
const IV_BITS = 96;
const PBKDF2_ITERATIONS = 100_000;
const SALT_BITS = 128;

/** Derive an AES-GCM key from a password + salt using PBKDF2. */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_BITS },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Generate cryptographically random bytes. */
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Encrypt a File (or Blob) with AES-GCM.
 * The IV is prepended to the ciphertext so we only need to track salt + ciphertext.
 */
export async function encryptFile(
  file: File | Blob,
  password: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; iv: Uint8Array }> {
  const salt = randomBytes(SALT_BITS / 8);
  const iv = randomBytes(IV_BITS / 8);
  const key = await deriveKey(password, salt);

  const arrayBuffer = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv as BufferSource },
    key,
    arrayBuffer
  );

  return {
    encrypted: new Uint8Array(ciphertext),
    salt,
    iv,
  };
}

/**
 * Decrypt ciphertext (with IV prepended) back into an ArrayBuffer.
 */
export async function decryptFile(
  ciphertext: Uint8Array | ArrayBuffer,
  password: string,
  salt: Uint8Array | string,
  iv: Uint8Array | string
): Promise<ArrayBuffer> {
  const key = await deriveKey(
    password,
    typeof salt === 'string' ? new TextEncoder().encode(salt) : salt
  );

  const ivBytes = typeof iv === 'string' ? new TextEncoder().encode(iv) : iv;

  const ct =
    ciphertext instanceof Uint8Array ? ciphertext.slice() : new Uint8Array(ciphertext);

  return crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBytes as BufferSource },
    key,
    ct as BufferSource
  );
}

/**
 * Convert a Uint8Array to a base64url string (for safe storage in DB / URL).
 */
export function toBase64Url(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert a base64url string back to a Uint8Array.
 */
export function fromBase64Url(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}