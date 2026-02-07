'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import ItemCard from '../../components/ItemCard';
import { useDesks } from '../../context/DesksContext';

export default function DeskPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { getDeskBySlug, updateDesk } = useDesks();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const desk = getDeskBySlug(slug);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!desk) {
    return (
      <div className="flex min-h-screen">
        <Sidebar activeSlug={slug} />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-800">Desk not found</h1>
          <Link href="/" className="text-[#ffa000] hover:underline mt-4 inline-block">
            Go back
          </Link>
        </main>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditValue(desk.label);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim()) {
      updateDesk(desk.id, { label: editValue.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeSlug={slug} />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-[#ffa000] outline-none px-1"
            />
          ) : (
            <h1
              onClick={handleStartEdit}
              className="text-2xl font-bold text-gray-800 cursor-pencil hover:text-[#ffa000] transition-colors"
              title="Click to edit"
            >
              {desk.label}
            </h1>
          )}
          <div className="w-10 h-10 rounded-full bg-[#ffa000] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
        </div>

        {/* Items */}
        <div className="flex flex-wrap gap-6">
          {desk.items.map((item) => (
            <ItemCard key={item.id} item={item} deskSlug={slug} />
          ))}
          <ItemCard deskSlug={slug} isAddCard />
        </div>
      </main>
    </div>
  );
}
