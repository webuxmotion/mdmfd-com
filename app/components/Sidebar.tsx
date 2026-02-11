'use client';

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDroppable } from '@dnd-kit/core';
import { useDesks } from '../context/DesksContext';
import { Desk } from '../data/desks';
import { mockFriends } from '../data/friendDesks';

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 280;

interface SidebarProps {
  activeSlug?: string;
  activeFriendUsername?: string;
}

interface DroppableDeskLinkProps {
  desk: Desk;
  isActive: boolean;
}

function DroppableDeskLink({ desk, isActive }: DroppableDeskLinkProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: desk.id,
  });

  return (
    <Link
      ref={setNodeRef}
      href={`/desk/${desk.slug}`}
      className={`w-full block text-left px-4 py-3 text-[var(--sidebar-text)] transition-colors relative ${
        isActive ? 'bg-[var(--sidebar-active)] font-medium' : 'hover:bg-[var(--sidebar-hover)]'
      } ${isOver ? 'bg-[var(--primary-dark)] ring-2 ring-[var(--primary)] ring-inset' : ''}`}
    >
      {isOver && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--primary)] text-lg font-bold">
          +
        </span>
      )}
      <span className={isOver ? 'ml-4' : ''}>{desk.label}</span>
      {isActive && !isOver && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-[var(--background)]" />
      )}
    </Link>
  );
}

export default function Sidebar({ activeSlug, activeFriendUsername }: SidebarProps) {
  const pathname = usePathname();
  const { desks, addDesk } = useDesks();
  const [newDeskName, setNewDeskName] = useState('');
  const [isAddingDesk, setIsAddingDesk] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [openFriendMenu, setOpenFriendMenu] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Load saved sidebar width from localStorage on mount (useLayoutEffect to avoid flash)
  useLayoutEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
        setSidebarWidth(width);
        document.documentElement.style.setProperty('--sidebar-width', width + 'px');
      }
    }
  }, []);

  const isMfdPage = pathname?.startsWith('/friends');
  const viewMode = isMfdPage ? 'mfd' : 'md';

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
    setSidebarWidth(newWidth);
    localStorage.setItem('sidebarWidth', newWidth.toString());
    // Update CSS variable for consistency
    document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
  }, []);

  // Handle mouse up to stop resize
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const startResize = () => {
    setIsResizing(true);
  };

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

  const filteredFriends = mockFriends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(friendSearch.toLowerCase()) ||
      friend.fullName.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <aside
      className="relative min-h-screen bg-[var(--sidebar-bg)] flex flex-col border-r border-[var(--border-color)] transition-colors"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-10 ${
          isResizing ? 'bg-[var(--primary)]' : 'hover:bg-[var(--primary)]'
        }`}
        onMouseDown={startResize}
      />
      {/* View Mode Switcher */}
      <div className="p-4 flex justify-center">
        <div className="inline-flex items-center gap-1 bg-[var(--sidebar-active)] rounded-full p-1.5">
          <Link
            href="/"
            className={`px-6 py-2 rounded-full text-base font-bold transition-colors ${
              viewMode === 'md'
                ? 'bg-[var(--surface)] text-[var(--primary)]'
                : 'text-[var(--sidebar-text)] opacity-70 hover:opacity-100'
            }`}
            title="My Desks"
          >
            MD
          </Link>
          <Link
            href="/friends"
            className={`px-6 py-2 rounded-full text-base font-bold transition-colors ${
              viewMode === 'mfd'
                ? 'bg-[var(--surface)] text-[var(--primary)]'
                : 'text-[var(--sidebar-text)] opacity-70 hover:opacity-100'
            }`}
            title="My Friend's Desks"
          >
            MFD
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col">
        {viewMode === 'md' ? (
          <>
            {desks.map((desk) => (
              <DroppableDeskLink
                key={desk.id}
                desk={desk}
                isActive={activeSlug === desk.slug}
              />
            ))}

            {/* Add New Desk */}
            <div className="px-4 mt-4">
              {isAddingDesk ? (
                <div className="bg-[var(--surface)] rounded-md overflow-hidden border border-[var(--border-color)]">
                  <input
                    type="text"
                    value={newDeskName}
                    onChange={(e) => setNewDeskName(e.target.value)}
                    placeholder="Desk name"
                    className="w-full px-3 py-2 text-[var(--foreground)] bg-[var(--input-bg)] outline-none border-2 border-[var(--primary)]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                  <div className="flex">
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2 bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-2 bg-[var(--surface)] text-[var(--foreground)] text-sm font-medium border-t border-[var(--border-color)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingDesk(true)}
                  className="text-[var(--sidebar-text)] text-sm hover:underline"
                >
                  + Add new
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Search Friends */}
            <div className="px-4 mb-2">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-white/70 fill-current"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <input
                  type="text"
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder=""
                  className="w-full bg-transparent border-b border-white/30 py-2 pl-6 text-white placeholder-white/50 outline-none focus:border-white/60"
                />
              </div>
            </div>

            {/* Friends List */}
            <div className="flex-1">
              {filteredFriends.map((friend) => {
                const isActive = activeFriendUsername === friend.username;
                return (
                  <div key={friend.id} className="relative">
                    <Link
                      href={`/friends/${friend.username}`}
                      className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                        isActive
                          ? 'bg-[var(--sidebar-active)]'
                          : 'hover:bg-[#ff8f00]'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-500 fill-current">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate">{friend.username}</div>
                        <div className="text-white/70 text-xs truncate">{friend.fullName}</div>
                      </div>

                      {/* Status Icon */}
                      <div className="w-6 h-6 flex items-center justify-center text-white/70">
                        {friend.status === 'accepted' ? (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                          </svg>
                        )}
                      </div>

                      {/* Active indicator arrow */}
                      {isActive && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-[var(--background)]" />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
