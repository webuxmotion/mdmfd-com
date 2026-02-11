'use client';

import { use, useState, ReactNode } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import UserProfileButton from '../../components/UserProfileButton';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import { getFriendByUsername, getFriendDesks } from '../../data/friendDesks';
import { Desk, DeskItem } from '../../data/desks';

// Read-only item card for friend's desks
function FriendItemCard({ item }: { item: DeskItem }) {
  const typeIcons: Record<string, ReactNode> = {
    facebook: (
      <svg viewBox="0 0 24 24" className="w-12 h-12 text-white fill-current">
        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
      </svg>
    ),
    linkedin: (
      <svg viewBox="0 0 24 24" className="w-12 h-12 text-white fill-current">
        <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
      </svg>
    ),
    instagram: (
      <svg viewBox="0 0 24 24" className="w-12 h-12 text-white fill-current">
        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
      </svg>
    ),
    note: (
      <svg viewBox="0 0 24 24" className="w-12 h-12 text-white fill-current">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" className="w-12 h-12 text-white fill-current">
        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
      </svg>
    ),
    custom: (
      <svg viewBox="0 0 24 24" className="w-12 h-12 text-white fill-current">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  };

  const bgColors: Record<string, string> = {
    facebook: 'bg-[var(--card-facebook)]',
    linkedin: 'bg-[var(--card-linkedin)]',
    instagram: 'bg-[var(--card-instagram)]',
    note: 'bg-[var(--card-note)]',
    book: 'bg-[var(--card-book)]',
    custom: 'bg-[var(--card-custom)]',
  };

  const buttonColors: Record<string, string> = {
    facebook: 'bg-[var(--card-facebook-btn)]',
    linkedin: 'bg-[var(--card-linkedin-btn)]',
    instagram: 'bg-[var(--card-instagram-btn)]',
    note: 'bg-[var(--card-note-btn)]',
    book: 'bg-[var(--card-book-btn)]',
    custom: 'bg-[var(--card-custom-btn)]',
  };

  const type = item.type || 'custom';

  return (
    <div className={`relative w-[160px] h-[160px] rounded-lg overflow-hidden flex flex-col ${bgColors[type] || bgColors.custom}`}>
      {/* External link icon */}
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 hover:opacity-80 transition-opacity z-10"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/70 fill-current">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}

      {/* Card Content */}
      <div className="flex items-center justify-center flex-1 p-3">
        {item.cardViewType === 'emoji' && item.emoji ? (
          <span className="text-5xl">{item.emoji}</span>
        ) : item.cardViewType === 'image' && item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
        ) : (
          typeIcons[type] || typeIcons.custom
        )}
      </div>

      {/* Label (read-only) */}
      <div className={`w-full py-2 text-white font-medium text-sm text-center ${buttonColors[type] || buttonColors.custom}`}>
        {item.title}
      </div>
    </div>
  );
}

// Desk section showing items
function FriendDeskSection({ desk }: { desk: Desk }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-4 text-xl font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 fill-current transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        >
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
        </svg>
        {desk.label}
        <span className="text-sm font-normal text-[var(--text-muted)]">({desk.items.length})</span>
      </button>

      {isExpanded && (
        <div className="flex flex-wrap gap-4">
          {desk.items.length > 0 ? (
            desk.items.map((item) => <FriendItemCard key={item.id} item={item} />)
          ) : (
            <p className="text-[var(--text-muted)] text-sm">No items in this desk</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function FriendDesksPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const friend = getFriendByUsername(username);
  const friendDesks = getFriendDesks(username);

  if (!friend) {
    return (
      <div className="flex min-h-screen bg-[var(--background)] transition-colors">
        <Sidebar activeFriendUsername={username} />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Friend not found</h1>
          <Link href="/friends" className="text-[var(--primary)] hover:underline mt-4 inline-block">
            Go back to friends
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] transition-colors">
      <Sidebar activeFriendUsername={username} />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {friend.avatar ? (
                <img src={friend.avatar} alt={friend.fullName} className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400 fill-current">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{friend.fullName}</h1>
              <p className="text-[var(--text-muted)]">@{friend.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <UserProfileButton />
          </div>
        </div>

        {/* Friend's Desks */}
        {friendDesks.length > 0 ? (
          friendDesks.map((desk) => <FriendDeskSection key={desk.id} desk={desk} />)
        ) : (
          <p className="text-[var(--text-muted)]">This friend hasn't shared any desks yet.</p>
        )}
      </main>
    </div>
  );
}
