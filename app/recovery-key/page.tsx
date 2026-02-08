'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function RecoveryKeyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // Check for pending recovery key in sessionStorage (from registration)
    const pending = sessionStorage.getItem('pendingRecoveryKey');
    if (pending) {
      setRecoveryKey(pending);
    } else if (status === 'authenticated') {
      // Check if there's a pending recovery key on the server (for existing users)
      fetch('/api/auth/pending-recovery-key')
        .then((res) => res.json())
        .then((data) => {
          if (data.recoveryKey) {
            setRecoveryKey(data.recoveryKey);
          } else {
            // No pending recovery key, redirect to home
            router.push('/');
          }
        })
        .catch(() => {
          router.push('/');
        });
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleCopy = async () => {
    if (recoveryKey) {
      await navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinue = async () => {
    // Clear the pending recovery key
    sessionStorage.removeItem('pendingRecoveryKey');

    // Also clear from server if it exists there
    await fetch('/api/auth/pending-recovery-key', { method: 'DELETE' });

    router.push('/');
  };

  if (status === 'loading' || !recoveryKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ffa000] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#ffa000] rounded-full px-6 py-3">
            <span className="text-white font-bold text-xl">MD</span>
            <span className="text-white font-bold text-xl">MFD</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#ffa000] fill-current">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Save Your Recovery Key</h1>
            <p className="text-gray-600 text-sm">
              This is your account recovery key. If you forget your password, you can use this key to recover your encrypted data.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <code className="text-lg font-mono font-bold text-gray-800 tracking-wider">
                {recoveryKey}
              </code>
            </div>
            <button
              onClick={handleCopy}
              className="w-full mt-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-600 fill-current">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  Copy to clipboard
                </>
              )}
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600 fill-current flex-shrink-0 mt-0.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Important!</p>
                <ul className="list-disc list-inside space-y-1 text-red-700">
                  <li>Write this key down and store it in a safe place</li>
                  <li>This key will NOT be shown again</li>
                  <li>Without this key, you cannot recover your encrypted data if you forget your password</li>
                </ul>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#ffa000] focus:ring-[#ffa000]"
            />
            <span className="text-sm text-gray-700">
              I have saved my recovery key in a safe place and understand that I cannot recover my encrypted data without it.
            </span>
          </label>

          <button
            onClick={handleContinue}
            disabled={!confirmed}
            className="w-full py-3 bg-[#ffa000] text-white rounded-lg font-medium hover:bg-[#ff8f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
