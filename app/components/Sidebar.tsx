'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDesks } from '../context/DesksContext';

interface SidebarProps {
  activeSlug?: string;
}

export default function Sidebar({ activeSlug }: SidebarProps) {
  const { desks, addDesk } = useDesks();
  const [newDeskName, setNewDeskName] = useState('');
  const [isAddingDesk, setIsAddingDesk] = useState(false);

  const handleSave = () => {
    if (newDeskName.trim()) {
      const slug = newDeskName.trim().toLowerCase().replace(/\s+/g, '-');
      addDesk({
        slug,
        label: newDeskName.trim(),
        items: [],
      });
      setNewDeskName('');
      setIsAddingDesk(false);
    }
  };

  const handleCancel = () => {
    setNewDeskName('');
    setIsAddingDesk(false);
  };

  return (
    <aside className="w-[280px] min-h-screen bg-[#ffa000] flex flex-col">
      {/* Logo */}
      <Link href="/" className="p-4 flex items-center gap-2">
        <span className="bg-white text-[#ffa000] font-bold px-3 py-1 rounded-full text-sm">
          MD
        </span>
        <span className="text-white font-bold text-lg">MFD</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1">
        {desks.map((desk) => (
          <Link
            key={desk.id}
            href={`/desk/${desk.slug}`}
            className={`w-full block text-left px-4 py-3 text-white transition-colors relative ${
              activeSlug === desk.slug
                ? 'bg-[#f57c00] font-medium'
                : 'hover:bg-[#ff8f00]'
            }`}
          >
            {desk.label}
            {activeSlug === desk.slug && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white" />
            )}
          </Link>
        ))}

        {/* Add New Desk */}
        <div className="px-4 mt-4">
          {isAddingDesk ? (
            <div className="bg-white rounded-md overflow-hidden">
              <input
                type="text"
                value={newDeskName}
                onChange={(e) => setNewDeskName(e.target.value)}
                placeholder="Desk name"
                className="w-full px-3 py-2 text-gray-800 outline-none border-2 border-[#ffa000]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <div className="flex">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 bg-[#ffa000] text-white text-sm font-medium hover:bg-[#ff8f00] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-white text-gray-800 text-sm font-medium border-t border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingDesk(true)}
              className="text-white text-sm hover:underline"
            >
              + Add new
            </button>
          )}
        </div>
      </nav>
    </aside>
  );
}
