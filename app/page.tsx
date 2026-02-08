'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDesks } from './context/DesksContext';
import Sidebar from './components/Sidebar';

export default function Home() {
  const router = useRouter();
  const { desks } = useDesks();

  useEffect(() => {
    if (desks.length > 0) {
      router.replace(`/desk/${desks[0].slug}`);
    }
  }, [desks, router]);

  // Show empty page with sidebar while redirecting
  return (
    <div className="flex min-h-screen bg-[var(--background)] transition-colors">
      <Sidebar />
      <main className="flex-1" />
    </div>
  );
}
