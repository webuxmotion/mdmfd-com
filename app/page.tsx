'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDesks } from './context/DesksContext';

export default function Home() {
  const router = useRouter();
  const { desks, isLoading } = useDesks();

  useEffect(() => {
    if (!isLoading && desks.length > 0) {
      router.replace(`/desk/${desks[0].slug}`);
    }
  }, [desks, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#ffa000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
