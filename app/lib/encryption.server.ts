/**
 * Server-side encryption utilities using Node.js crypto
 * Used for generating and encrypting master keys during registration
 */

import crypto from 'crypto';

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000;

/**
 * Generates a random 256-bit master key
 * Returns as base64 string
 */
export function generateMasterKey(): string {
  const keyBytes = crypto.randomBytes(KEY_LENGTH);
  return keyBytes.toString('base64');
}

/**
 * Derives an encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts the master key with user's password
 * Returns base64 encoded: salt + iv + ciphertext with ENC: prefix
 */
export function encryptMasterKey(masterKeyBase64: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(masterKeyBase64, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + ciphertext
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);
  return 'ENC:' + combined.toString('base64');
}

/**
 * Decrypts the master key with user's password
 */
export function decryptMasterKey(encryptedMasterKey: string, password: string): string {
  if (!encryptedMasterKey.startsWith('ENC:')) {
    throw new Error('Invalid encrypted data format');
  }

  const combined = Buffer.from(encryptedMasterKey.slice(4), 'base64');

  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + 16);

  const key = deriveKey(password, salt);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
