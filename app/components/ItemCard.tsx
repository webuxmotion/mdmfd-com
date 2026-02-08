'use client';

import Link from 'next/link';
import { ReactNode, useState, useEffect } from 'react';
import { DeskItem } from '../data/desks';
import { useEncryption } from '../context/EncryptionContext';

interface ItemCardProps {
  item?: DeskItem;
  deskSlug: string;
  deskId?: string;
  isAddCard?: boolean;
  isDragOverlay?: boolean;
}

const typeIcons: Record<string, ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" className="w-16 h-16 text-white fill-current">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" className="w-16 h-16 text-white fill-current">
      <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="w-16 h-16 text-white fill-current">
      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" className="w-16 h-16 text-white fill-current">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" className="w-16 h-16 text-white fill-current">
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 24 24" className="w-16 h-16 text-white fill-current">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
  add: (
    <svg viewBox="0 0 24 24" className="w-16 h-16 text-[#d4c4a8] fill-current">
      <path d="M12 4v16m-8-8h16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  ),
};

const bgColors: Record<string, string> = {
  facebook: 'bg-[#3b5998]',
  linkedin: 'bg-[#4a9ab8]',
  instagram: 'bg-[#5b6ba8]',
  note: 'bg-[#4caf50]',
  book: 'bg-[#9c27b0]',
  custom: 'bg-[#607d8b]',
  add: 'bg-[#e8dcc8]',
};

const buttonColors: Record<string, string> = {
  facebook: 'bg-[#5a7abf]',
  linkedin: 'bg-[#6ab4ce]',
  instagram: 'bg-[#7b8bc8]',
  note: 'bg-[#66bb6a]',
  book: 'bg-[#ab47bc]',
  custom: 'bg-[#78909c]',
  add: 'bg-[#ffa000]',
};

export default function ItemCard({ item, deskSlug, deskId, isAddCard, isDragOverlay }: ItemCardProps) {
  const { decryptField, isFieldEncrypted, isUnlocked } = useEncryption();
  const [decryptedTitle, setDecryptedTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!item || isAddCard) return;

    const decryptTitle = async () => {
      if (isUnlocked && isFieldEncrypted(item.title)) {
        try {
          const decrypted = await decryptField(item.title);
          setDecryptedTitle(decrypted);
        } catch {
          setDecryptedTitle(item.title);
        }
      } else {
        setDecryptedTitle(item.title);
      }
    };

    decryptTitle();
  }, [item, isAddCard, isUnlocked, decryptField, isFieldEncrypted]);

  const type = isAddCard ? 'add' : (item?.type || 'custom');
  const href = isAddCard
    ? `/desk/${deskSlug}/item/new`
    : `/desk/${deskSlug}/item/${item?.id}`;

  const displayTitle = decryptedTitle || item?.title || 'Untitled';

  return (
    <div
      className={`relative w-[160px] h-[160px] rounded-lg overflow-hidden flex flex-col ${bgColors[type] || bgColors.custom} ${isDragOverlay ? 'shadow-2xl scale-105' : ''}`}
    >
      {/* External link icon */}
      {!isAddCard && item?.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 hover:opacity-80 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/70 fill-current">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}

      {/* Card Content based on cardViewType */}
      <div className="flex items-center justify-center flex-1 p-3">
        {isAddCard ? (
          typeIcons.add
        ) : item?.cardViewType === 'emoji' && item?.emoji ? (
          <span className="text-5xl">{item.emoji}</span>
        ) : item?.cardViewType === 'image' && item?.image ? (
          <img src={item.image} alt={displayTitle} className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <span className="text-white font-semibold text-center text-sm leading-tight line-clamp-4">
            {isFieldEncrypted(displayTitle) ? '••••' : displayTitle}
          </span>
        )}
      </div>

      {/* Button */}
      <Link
        href={href}
        className={`block w-full py-2 text-white font-medium text-sm text-center cursor-pointer ${buttonColors[type] || buttonColors.custom} hover:opacity-90 transition-opacity`}
      >
        {isAddCard ? 'Add new' : 'Open'}
      </Link>
    </div>
  );
}
