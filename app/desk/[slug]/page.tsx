'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import ItemCard from '../../components/ItemCard';
import UserProfileButton from '../../components/UserProfileButton';
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
          <UserProfileButton />
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
