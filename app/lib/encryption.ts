/**
 * Client-side encryption utilities using Web Crypto API
 * Uses AES-256-GCM for authenticated encryption
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const ITERATIONS = 100000;

/**
 * Derives an encryption key from a passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Create a new Uint8Array with a fresh ArrayBuffer to ensure type compatibility
  const saltBuffer = new Uint8Array(salt.length);
  saltBuffer.set(salt);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns base64 encoded string: salt + iv + ciphertext
 */
export async function encrypt(plaintext: string, passphrase: string): Promise<string> {
  if (!plaintext) return '';

  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(passphrase, salt);

  // Create a new Uint8Array with a fresh ArrayBuffer for iv
  const ivBuffer = new Uint8Array(iv.length);
  ivBuffer.set(iv);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encoder.encode(plaintext)
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Return as base64 with prefix to identify encrypted content
  return 'ENC:' + btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a string that was encrypted with encrypt()
 */
export async function decrypt(encryptedData: string, passphrase: string): Promise<string> {
  if (!encryptedData) return '';

  // Check if data is encrypted
  if (!encryptedData.startsWith('ENC:')) {
    return encryptedData; // Return as-is if not encrypted
  }

  try {
    const base64Data = encryptedData.slice(4); // Remove 'ENC:' prefix
    const combined = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(passphrase, salt);

    // Create new Uint8Arrays with fresh ArrayBuffers for type compatibility
    const ivBuffer = new Uint8Array(iv.length);
    ivBuffer.set(iv);
    const ciphertextBuffer = new Uint8Array(ciphertext.length);
    ciphertextBuffer.set(ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt. Wrong passphrase?');
  }
}

/**
 * Checks if a string is encrypted
 */
export function isEncrypted(data: string): boolean {
  return data?.startsWith('ENC:') ?? false;
}

/**
 * Hashes passphrase to create a verifiable hash (for passphrase verification)
 */
export async function hashPassphrase(passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase + '_verify');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a random 256-bit master key
 * Returns as base64 string
 */
export function generateMasterKey(): string {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
  return btoa(String.fromCharCode(...keyBytes));
}

/**
 * Encrypts data using a raw master key (base64 encoded)
 * Uses AES-256-GCM
 */
export async function encryptWithMasterKey(plaintext: string, masterKeyBase64: string): Promise<string> {
  if (!plaintext) return '';

  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Decode master key from base64
  const masterKeyBytes = Uint8Array.from(atob(masterKeyBase64), c => c.charCodeAt(0));

  // Import the raw key
  const key = await crypto.subtle.importKey(
    'raw',
    masterKeyBytes,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt']
  );

  const ivBuffer = new Uint8Array(iv.length);
  ivBuffer.set(iv);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encoder.encode(plaintext)
  );

  // Combine iv + ciphertext (no salt needed since we use raw key)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return 'ENC:' + btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data using a raw master key (base64 encoded)
 */
export async function decryptWithMasterKey(encryptedData: string, masterKeyBase64: string): Promise<string> {
  if (!encryptedData) return '';

  if (!encryptedData.startsWith('ENC:')) {
    return encryptedData;
  }

  try {
    const base64Data = encryptedData.slice(4);
    const combined = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    // Decode master key from base64
    const masterKeyBytes = Uint8Array.from(atob(masterKeyBase64), c => c.charCodeAt(0));

    // Import the raw key
    const key = await crypto.subtle.importKey(
      'raw',
      masterKeyBytes,
      { name: 'AES-GCM', length: KEY_LENGTH },
      false,
      ['decrypt']
    );

    const ivBuffer = new Uint8Array(iv.length);
    ivBuffer.set(iv);
    const ciphertextBuffer = new Uint8Array(ciphertext.length);
    ciphertextBuffer.set(ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption with master key failed:', error);
    throw new Error('Failed to decrypt with master key');
  }
}

const AUTH_TAG_LENGTH = 16;

/**
 * Decrypts the master key that was encrypted by the server
 * Server format: ENC: + base64(salt + iv + authTag + ciphertext)
 */
export async function decryptMasterKey(encryptedMasterKey: string, password: string): Promise<string> {
  if (!encryptedMasterKey || !encryptedMasterKey.startsWith('ENC:')) {
    throw new Error('Invalid encrypted master key format');
  }

  try {
    const base64Data = encryptedMasterKey.slice(4);
    const combined = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    // Derive key from password
    const key = await deriveKey(password, salt);

    // For Web Crypto API, we need to append authTag to ciphertext
    const ciphertextWithTag = new Uint8Array(ciphertext.length + authTag.length);
    ciphertextWithTag.set(ciphertext, 0);
    ciphertextWithTag.set(authTag, ciphertext.length);

    const ivBuffer = new Uint8Array(iv.length);
    ivBuffer.set(iv);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      ciphertextWithTag
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Failed to decrypt master key:', error);
    throw new Error('Failed to decrypt master key. Wrong password?');
  }
}

/**
 * Re-encrypts the master key with a new password (client-side)
 * Used when user changes password
 */
export async function encryptMasterKey(masterKeyBase64: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt);

  const ivBuffer = new Uint8Array(iv.length);
  ivBuffer.set(iv);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encoder.encode(masterKeyBase64)
  );

  // Web Crypto appends authTag to ciphertext
  // Extract authTag (last 16 bytes) and ciphertext separately
  const ciphertextArray = new Uint8Array(ciphertext);
  const actualCiphertext = ciphertextArray.slice(0, ciphertextArray.length - AUTH_TAG_LENGTH);
  const authTag = ciphertextArray.slice(ciphertextArray.length - AUTH_TAG_LENGTH);

  // Format: salt + iv + authTag + ciphertext (matching server format)
  const combined = new Uint8Array(salt.length + iv.length + authTag.length + actualCiphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(authTag, salt.length + iv.length);
  combined.set(actualCiphertext, salt.length + iv.length + authTag.length);

  return 'ENC:' + btoa(String.fromCharCode(...combined));
}
