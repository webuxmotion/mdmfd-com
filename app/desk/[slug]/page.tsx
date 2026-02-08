'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import Sidebar from '../../components/Sidebar';
import ItemCard from '../../components/ItemCard';
import SortableItemCard from '../../components/SortableItemCard';
import UserProfileButton from '../../components/UserProfileButton';
import ThemeSwitcher from '../../components/ThemeSwitcher';
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
      <div className="flex min-h-screen bg-[var(--background)] transition-colors">
        <Sidebar activeSlug={slug} />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Desk not found</h1>
          <Link href="/" className="text-[var(--primary)] hover:underline mt-4 inline-block">
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
    <div className="flex min-h-screen bg-[var(--background)] transition-colors">
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
              className="text-2xl font-bold text-[var(--foreground)] bg-transparent border-b-2 border-[var(--primary)] outline-none px-1"
            />
          ) : (
            <h1
              onClick={handleStartEdit}
              className="text-2xl font-bold text-[var(--foreground)] cursor-pencil hover:text-[var(--primary)] transition-colors"
              title="Click to edit"
            >
              {desk.label}
            </h1>
          )}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <UserProfileButton />
          </div>
        </div>

        {/* Items */}
        <SortableContext items={desk.items.map(item => item.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-6">
            {desk.items.map((item) => (
              <SortableItemCard key={item.id} item={item} deskSlug={slug} deskId={desk.id} />
            ))}
            <ItemCard deskSlug={slug} isAddCard />
          </div>
        </SortableContext>
      </main>
    </div>
  );
}
