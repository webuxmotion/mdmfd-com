'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import UserProfileButton from '../components/UserProfileButton';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const result = await updateProfile({
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
    });

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Your profile</h1>
          <UserProfileButton />
        </div>

        {/* Profile Form */}
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex gap-12">
                {/* Form Fields */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-gray-600">Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ffa000]"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="w-20 text-gray-600">Link</label>
                    <div className="flex-1 flex items-center">
                      <span className="text-gray-500 mr-1">https://mdmfd.com/</span>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ffa000]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="w-20 text-gray-600">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ffa000]"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="w-20 text-gray-600">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1234567890"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ffa000]"
                    />
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-12 py-2 bg-[#ffa000] text-white rounded-lg font-medium hover:bg-[#ff8f00] transition-colors disabled:opacity-50"
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
                  <span className="text-gray-600 mb-3">Photo</span>
                  <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center mb-3 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-16 h-16 text-gray-300 fill-current">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                      </svg>
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-6 py-1.5 border border-[#ffa000] text-[#ffa000] rounded-lg text-sm hover:bg-[#ffa000] hover:text-white transition-colors"
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
