'use client';

import { useState, use, useEffect, useCallback, useRef, ReactNode } from 'react';
import Link from 'next/link';
import Sidebar from '../../../../components/Sidebar';
import MarkdownEditor from '../../../../components/MarkdownEditor';
import UserProfileButton from '../../../../components/UserProfileButton';
import { useDesks } from '../../../../context/DesksContext';
import { useEncryption } from '../../../../context/EncryptionContext';
import { DeskItem } from '../../../../data/desks';

const typeIcons: Record<string, ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
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
};

export default function ItemPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const { getDeskBySlug, getItem, updateItem } = useDesks();
  const {
    isUnlocked,
    encryptField,
    decryptField,
    isFieldEncrypted,
  } = useEncryption();

  const desk = getDeskBySlug(slug);
  const item = desk ? getItem(desk.id, id) : undefined;

  const [formData, setFormData] = useState({
    title: '',
    link: '',
    description: '',
    readme: '',
    cardViewType: 'title' as 'title' | 'image' | 'emoji',
    emoji: '',
  });
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCardViewMenu, setShowCardViewMenu] = useState(false);
  const cardViewMenuRef = useRef<HTMLDivElement>(null);
  const [decryptedTitles, setDecryptedTitles] = useState<Record<string, string>>({});

  // Decrypt all item titles for tabs
  useEffect(() => {
    if (!desk || !isUnlocked) return;

    const decryptAllTitles = async () => {
      const titles: Record<string, string> = {};
      for (const i of desk.items) {
        if (isFieldEncrypted(i.title)) {
          try {
            titles[i.id] = await decryptField(i.title);
          } catch {
            titles[i.id] = i.title;
          }
        } else {
          titles[i.id] = i.title;
        }
      }
      setDecryptedTitles(titles);
    };

    decryptAllTitles();
  }, [desk, isUnlocked, decryptField, isFieldEncrypted]);

  // Decrypt fields when item loads or when unlocked
  useEffect(() => {
    if (!item) return;

    const loadAndDecrypt = async () => {
      setIsDecrypting(true);
      setDecryptError(null);

      try {
        let title = item.title;
        let readme = item.readme || '';

        if (isUnlocked) {
          if (isFieldEncrypted(item.title)) {
            title = await decryptField(item.title);
          }
          if (isFieldEncrypted(item.readme || '')) {
            readme = await decryptField(item.readme || '');
          }
        }

        setFormData({
          title,
          link: item.link,
          description: item.description,
          readme,
          cardViewType: item.cardViewType || 'title',
          emoji: item.emoji || '',
        });
      } catch (error) {
        setDecryptError('Failed to decrypt. Please check your passphrase.');
      } finally {
        setIsDecrypting(false);
      }
    };

    loadAndDecrypt();
  }, [item, isUnlocked, decryptField, isFieldEncrypted]);

  if (!desk || !item) {
    return (
      <div className="flex min-h-screen">
        <Sidebar activeSlug={slug} />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-800">Item not found</h1>
          <Link href={`/desk/${slug}`} className="text-[#ffa000] hover:underline mt-4 inline-block">
            Go back
          </Link>
        </main>
      </div>
    );
  }

  const saveItem = async () => {
    let titleToSave = formData.title;
    let readmeToSave = formData.readme;

    // Always encrypt if unlocked
    if (isUnlocked) {
      titleToSave = await encryptField(formData.title);
      readmeToSave = await encryptField(formData.readme);
    }

    updateItem(desk.id, id, {
      title: titleToSave,
      link: formData.link,
      description: formData.description,
      readme: readmeToSave,
      cardViewType: formData.cardViewType,
      emoji: formData.emoji,
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveItem();
  };

  // Keyboard shortcut: Cmd+S or Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveItem();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, isUnlocked]);

  // Close card view menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardViewMenuRef.current && !cardViewMenuRef.current.contains(e.target as Node)) {
        setShowCardViewMenu(false);
      }
    };

    if (showCardViewMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCardViewMenu]);

  return (
    <div className="flex min-h-screen">
      <Sidebar activeSlug={slug} />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href={`/desk/${slug}`}
              className="text-[#ffa000] hover:underline text-xl font-bold"
            >
              {desk.label}
            </Link>
            <span className="text-gray-800 text-xl font-bold"> -&gt; {formData.title || 'Untitled'}</span>
          </div>
          <div className="flex items-center gap-4">
                        <UserProfileButton />
          </div>
        </div>

        {/* Item tabs */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href={`/desk/${slug}`}
            className="w-12 h-12 rounded-lg bg-[#e8dcc8] flex items-center justify-center hover:bg-[#d4c4a8] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#b8a888] fill-current">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </Link>

          {desk.items.map((i) => (
            <Link
              key={i.id}
              href={`/desk/${slug}/item/${i.id}`}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-opacity overflow-hidden ${bgColors[i.type] || bgColors.custom} ${
                item.id === i.id ? 'opacity-100 ring-2 ring-[#ffa000]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {i.cardViewType === 'emoji' && i.emoji ? (
                <span className="text-2xl">{i.emoji}</span>
              ) : i.cardViewType === 'image' && i.image ? (
                <img src={i.image} alt={decryptedTitles[i.id] || i.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[10px] font-medium text-center px-1 line-clamp-2">
                  {decryptedTitles[i.id] || i.title || 'Untitled'}
                </span>
              )}
            </Link>
          ))}

          <Link
            href={`/desk/${slug}/item/new`}
            className="w-12 h-12 rounded-lg bg-[#e8dcc8] flex items-center justify-center hover:bg-[#d4c4a8] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#b8a888]">
              <path d="M12 4v16m-8-8h16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {isDecrypting ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#ffa000] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : decryptError ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-4">
            {decryptError}
          </div>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="flex items-center gap-4">
                {/* Card View Type Selector */}
                <div className="relative" ref={cardViewMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowCardViewMenu(!showCardViewMenu)}
                    className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColors[item.type] || bgColors.custom} hover:opacity-90 transition-opacity cursor-pointer`}
                    title="Change card view type"
                  >
                    {formData.cardViewType === 'emoji' && formData.emoji ? (
                      <span className="text-3xl">{formData.emoji}</span>
                    ) : formData.cardViewType === 'image' && item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-white text-xs font-medium text-center px-1 line-clamp-2">{formData.title || 'Title'}</span>
                    )}
                  </button>

                  {showCardViewMenu && (
                    <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, cardViewType: 'title' });
                          setShowCardViewMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${formData.cardViewType === 'title' ? 'text-[#ffa000] font-medium' : 'text-gray-700'}`}
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M5 4v3h5.5v12h3V7H19V4H5z" />
                        </svg>
                        Title
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, cardViewType: 'image' });
                          setShowCardViewMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${formData.cardViewType === 'image' ? 'text-[#ffa000] font-medium' : 'text-gray-700'}`}
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                        Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, cardViewType: 'emoji' });
                          setShowCardViewMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${formData.cardViewType === 'emoji' ? 'text-[#ffa000] font-medium' : 'text-gray-700'}`}
                      >
                        <span className="text-base">😀</span>
                        Emoji
                      </button>
                    </div>
                  )}
                </div>

                {/* Emoji input (shown when emoji type selected) */}
                {formData.cardViewType === 'emoji' && (
                  <div className="flex items-center gap-2">
                    <label className="text-gray-600 text-sm">Emoji</label>
                    <input
                      type="text"
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      placeholder="😀"
                      className="w-16 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#ffa000] text-sm text-center"
                      maxLength={2}
                    />
                  </div>
                )}

                {/* Title */}
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-gray-600 text-sm">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#ffa000] text-sm"
                  />
                </div>

                {/* Link */}
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-gray-600 text-sm">Link</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#ffa000] text-sm"
                  />
                  <button
                    type="button"
                    className="p-1.5 text-gray-400 hover:text-[#ffa000] transition-colors"
                    onClick={() => window.open(formData.link, '_blank')}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Description */}
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-gray-600 text-sm">Desc</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description..."
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#ffa000] text-sm"
                  />
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  className="px-6 py-1.5 bg-[#ffa000] text-white rounded-md font-medium hover:bg-[#ff8f00] transition-colors text-sm flex-shrink-0"
                >
                  Save
                </button>

                {/* Success message */}
                {showSuccess && (
                  <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Saved
                  </span>
                )}
              </div>
            </form>

            {/* Readme Editor */}
            <MarkdownEditor
              value={formData.readme}
              onChange={(readme) => setFormData({ ...formData, readme })}
            />
          </>
        )}
      </div>
    </div>
  );
}
