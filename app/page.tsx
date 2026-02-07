'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDesks } from './context/DesksContext';

export default function Home() {
  const router = useRouter();
  const { desks } = useDesks();

  useEffect(() => {
    if (desks.length > 0) {
      router.replace(`/desk/${desks[0].slug}`);
    }
  }, [desks, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}
