'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEncryption } from '../context/EncryptionContext';

interface SetupEncryptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SetupEncryptionModal({ isOpen, onClose, onSuccess }: SetupEncryptionModalProps) {
  const { update: updateSession } = useSession();
  const { unlockWithPassword } = useEncryption();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/setup-encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to setup encryption');
        setIsLoading(false);
        return;
      }

      // Show recovery key
      setRecoveryKey(data.recoveryKey);

      // Update session with new encryptedMasterKey
      await updateSession({ encryptedMasterKey: data.encryptedMasterKey });

      // Unlock encryption with the password
      await unlockWithPassword(data.encryptedMasterKey, password);

    } catch (err) {
      setError('Failed to setup encryption. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRecoveryKey = () => {
    if (recoveryKey) {
      navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDone = () => {
    setPassword('');
    setConfirmPassword('');
    setRecoveryKey(null);
    onSuccess();
  };

  // Show recovery key screen after setup
  if (recoveryKey) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--surface)] rounded-2xl shadow-xl max-w-md w-full p-8 border border-[var(--border-color)]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Encryption Set Up!</h2>
            <p className="text-[var(--text-muted)] text-sm mt-2">
              Save your recovery key in a safe place. You'll need it if you forget your password.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-[var(--text-muted)] text-sm mb-2">Recovery Key</label>
            <div className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-4 font-mono text-center text-lg tracking-wider text-[var(--foreground)]">
              {recoveryKey}
            </div>
            <button
              type="button"
              onClick={handleCopyRecoveryKey}
              className="mt-2 w-full py-2 text-[var(--primary)] text-sm font-medium hover:underline"
            >
              {copied ? '✓ Copied!' : 'Copy to clipboard'}
            </button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">
              <strong>Important:</strong> Write down this recovery key and store it securely.
              It cannot be recovered if lost!
            </p>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="w-full py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors"
          >
            I've Saved My Recovery Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-2xl shadow-xl max-w-md w-full p-8 border border-[var(--border-color)]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Setup Encryption</h2>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Create a password to encrypt your private data. This password will be used to protect your notes.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSetup}>
          <div className="mb-4">
            <label className="block text-[var(--text-muted)] text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              placeholder="Create a password"
              autoFocus
              required
              minLength={6}
            />
          </div>

          <div className="mb-6">
            <label className="block text-[var(--text-muted)] text-sm mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              placeholder="Confirm your password"
              required
              minLength={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-[var(--border-color)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="flex-1 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Setup Encryption'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
