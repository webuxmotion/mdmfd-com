'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function UserProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push('/');
  };

  // If not logged in, show login button
  if (!user) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 bg-[#ffa000] text-white rounded-lg font-medium hover:bg-[#ff8f00] transition-colors text-sm"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="w-10 h-10 rounded-full bg-[#ffa000] flex items-center justify-center hover:bg-[#ff8f00] transition-colors overflow-hidden">
        {user.avatar ? (
          <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full pt-2 z-50">
          <div className="w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
              Your profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
