'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '../components/Sidebar';
import UserProfileButton from '../components/UserProfileButton';

interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
  });
  const [avatar, setAvatar] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    const response = await fetch('/api/auth/profile');
    if (response.ok) {
      const data = await response.json();
      const user: UserProfile = data.user;
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setAvatar(user.avatar);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      await update({
        name: formData.fullName,
        username: formData.username,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }

    setIsSaving(false);
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] transition-colors">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] transition-colors">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[var(--primary)]">Your profile</h1>
          <UserProfileButton />
        </div>

        {/* Profile Form */}
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit}>
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] p-8">
              <div className="flex gap-12">
                {/* Form Fields */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-[var(--text-muted)]">Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="flex-1 px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="w-20 text-[var(--text-muted)]">Link</label>
                    <div className="flex-1 flex items-center">
                      <span className="text-[var(--text-muted)] mr-1">https://mdmfd.com/</span>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') })}
                        className="flex-1 px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="w-20 text-[var(--text-muted)]">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="flex-1 px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="w-20 text-[var(--text-muted)]">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1234567890"
                      className="flex-1 px-4 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)] placeholder-[var(--text-muted)]"
                    />
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-12 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    {showSuccess && (
                      <span className="ml-4 text-green-600 text-sm font-medium flex items-center gap-1">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        Saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Photo Section */}
                <div className="flex flex-col items-center">
                  <span className="text-[var(--text-muted)] mb-3">Photo</span>
                  <div className="w-28 h-28 rounded-full bg-[var(--surface-hover)] flex items-center justify-center mb-3 overflow-hidden">
                    {avatar || session.user.image ? (
                      <img src={avatar || session.user.image || ''} alt={formData.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-16 h-16 text-[var(--text-muted)] fill-current">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                      </svg>
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-6 py-1.5 border border-[var(--primary)] text-[var(--primary)] rounded-lg text-sm hover:bg-[var(--primary)] hover:text-white transition-colors"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
