'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { encryptWithMasterKey, decryptWithMasterKey, isEncrypted, decryptMasterKey } from '../lib/encryption';

interface EncryptionContextType {
  isUnlocked: boolean;
  setMasterKey: (masterKey: string) => void;
  unlockWithPassword: (encryptedMasterKey: string, password: string) => Promise<boolean>;
  clearMasterKey: () => void;
  encryptField: (plaintext: string) => Promise<string>;
  decryptField: (ciphertext: string) => Promise<string>;
  isFieldEncrypted: (data: string) => boolean;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

const SESSION_KEY = 'mdmfd_master_key';

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const [masterKey, setMasterKeyState] = useState<string | null>(null);

  // Load master key from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setMasterKeyState(stored);
      }
    }
  }, []);

  const isUnlocked = masterKey !== null;

  // Set master key directly (after decryption)
  const setMasterKey = useCallback((key: string) => {
    setMasterKeyState(key);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, key);
    }
  }, []);

  // Unlock encryption by decrypting the master key with user's password
  const unlockWithPassword = useCallback(async (encryptedMasterKey: string, password: string): Promise<boolean> => {
    try {
      const decryptedKey = await decryptMasterKey(encryptedMasterKey, password);
      setMasterKey(decryptedKey);
      return true;
    } catch (error) {
      console.error('Failed to unlock encryption:', error);
      return false;
    }
  }, [setMasterKey]);

  const clearMasterKey = useCallback(() => {
    setMasterKeyState(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const encryptField = useCallback(async (plaintext: string): Promise<string> => {
    if (!masterKey || !plaintext) return plaintext;
    return encryptWithMasterKey(plaintext, masterKey);
  }, [masterKey]);

  const decryptField = useCallback(async (ciphertext: string): Promise<string> => {
    if (!masterKey || !ciphertext) return ciphertext;
    if (!isEncrypted(ciphertext)) return ciphertext;
    return decryptWithMasterKey(ciphertext, masterKey);
  }, [masterKey]);

  const isFieldEncrypted = useCallback((data: string): boolean => {
    return isEncrypted(data);
  }, []);

  return (
    <EncryptionContext.Provider
      value={{
        isUnlocked,
        setMasterKey,
        unlockWithPassword,
        clearMasterKey,
        encryptField,
        decryptField,
        isFieldEncrypted,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}
