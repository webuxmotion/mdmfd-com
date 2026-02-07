'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDesks } from './context/DesksContext';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { desks, isLoading: desksLoading } = useDesks();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!desksLoading && desks.length > 0) {
      router.replace(`/desk/${desks[0].slug}`);
    }
  }, [desks, desksLoading, router]);

  // Show loading while checking auth and desks
  if (authLoading || desksLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // If not logged in, show welcome/login page
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          {/* Logo */}
          <div className="inline-flex items-center gap-2 bg-[#ffa000] rounded-full px-8 py-4 mb-8">
            <span className="text-white font-bold text-2xl">MD</span>
            <span className="text-white font-bold text-2xl">MFD</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome to MDMFD
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Manage your desks, social networks, notes, and books in one place. Sign in to access your personal dashboard.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-[#ffa000] text-white rounded-lg font-medium hover:bg-[#ff8f00] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 border border-[#ffa000] text-[#ffa000] rounded-lg font-medium hover:bg-[#ffa000] hover:text-white transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in but has no desks (shouldn't happen, but handle it)
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-500">Loading your desks...</div>
    </div>
  );
}
