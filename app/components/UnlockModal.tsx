'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEncryption } from '../context/EncryptionContext';

export default function UnlockModal() {
  const { data: session, status } = useSession();
  const { isUnlocked, unlockWithPassword } = useEncryption();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Only show modal if user is authenticated but encryption is locked
  const needsUnlock = status === 'authenticated' &&
    session?.user?.encryptedMasterKey &&
    !isUnlocked;

  if (!needsUnlock) {
    return null;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await unlockWithPassword(
        session.user.encryptedMasterKey!,
        password
      );

      if (!success) {
        setError('Incorrect password. Please try again.');
      }
    } catch {
      setError('Failed to unlock. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-2xl shadow-xl max-w-md w-full p-8 border border-[var(--border-color)]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[var(--primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Unlock Your Data</h2>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Enter your password to decrypt your data
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleUnlock}>
          <div className="mb-4">
            <label className="block text-[var(--text-muted)] text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              placeholder="Enter your password"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
