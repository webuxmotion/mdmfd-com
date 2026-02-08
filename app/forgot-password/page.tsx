'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'recovery'>('email');
  const [email, setEmail] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Check if email exists and has recovery key
    const response = await fetch('/api/auth/check-recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Email not found');
      setIsLoading(false);
      return;
    }

    if (!data.hasRecoveryKey) {
      setError('This account does not have a recovery key set up. Password reset is not available.');
      setIsLoading(false);
      return;
    }

    setStep('recovery');
    setIsLoading(false);
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        recoveryKey: recoveryKey.replace(/\s/g, '').toUpperCase(),
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Password reset failed');
      setIsLoading(false);
      return;
    }

    // Success - redirect to login
    router.push('/login?reset=success');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[var(--primary)] rounded-full px-6 py-3">
            <span className="text-white font-bold text-xl">MD</span>
            <span className="text-white/70 font-bold text-xl">MFD</span>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl shadow-lg border border-[var(--border-color)] p-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] text-center mb-2">Reset Password</h1>
          <p className="text-[var(--text-muted)] text-sm text-center mb-6">
            {step === 'email'
              ? 'Enter your email address to start the recovery process.'
              : 'Enter your recovery key and new password.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-[var(--text-muted)] text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)] placeholder-[var(--text-muted)]"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div>
                <label className="block text-[var(--text-muted)] text-sm mb-1">Recovery Key</label>
                <input
                  type="text"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)] font-mono tracking-wider placeholder-[var(--text-muted)]"
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                  required
                />
                <p className="text-[var(--text-muted)] text-xs mt-1">
                  Enter the recovery key you saved when you created your account.
                </p>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] text-sm mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] text-sm mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full py-2 text-[var(--text-muted)] text-sm hover:text-[var(--foreground)]"
              >
                Back to email
              </button>
            </form>
          )}

          <p className="text-center text-[var(--text-muted)] text-sm mt-6">
            Remember your password?{' '}
            <Link href="/login" className="text-[var(--primary)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
