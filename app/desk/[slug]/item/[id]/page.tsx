'use client';

import { useState, use, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import MarkdownEditor from '../../../../components/MarkdownEditor';
import UserProfileButton from '../../../../components/UserProfileButton';
import { useDesks } from '../../../../context/DesksContext';
import { useEncryption } from '../../../../context/EncryptionContext';

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
  const { getDeskBySlug, getItem, updateItem, deleteItem, refreshDesks } = useDesks();
  const router = useRouter();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cardViewMenuRef = useRef<HTMLDivElement>(null);
  const [decryptedTitles, setDecryptedTitles] = useState<Record<string, string>>({});
  const lastFetchedRef = useRef<string | null>(null);

  // Fetch fresh data from server when visiting the page
  useEffect(() => {
    const key = `${slug}-${id}`;
    if (lastFetchedRef.current !== key) {
      lastFetchedRef.current = key;
      refreshDesks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, id]);

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

  // Keyboard shortcut: Cmd+S or Ctrl+S to save
  useEffect(() => {
    if (!desk || !item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        // saveItem is not available here, so we need to dispatch a custom event
        document.dispatchEvent(new CustomEvent('save-item'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [desk, item]);

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

  // Listen for save event from keyboard shortcut
  // Must be before early return to maintain consistent hook order
  useEffect(() => {
    if (!desk || !item) return;

    const handleSaveEvent = async () => {
      let titleToSave = formData.title;
      let readmeToSave = formData.readme;

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

    document.addEventListener('save-item', handleSaveEvent);
    return () => document.removeEventListener('save-item', handleSaveEvent);
  }, [desk, item, id, formData, isUnlocked, encryptField, updateItem]);

  if (!desk || !item) {
    return (
      <div className="flex min-h-screen bg-[var(--background)] transition-colors">
        <Sidebar activeSlug={slug} />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Item not found</h1>
          <Link href={`/desk/${slug}`} className="text-[var(--primary)] hover:underline mt-4 inline-block">
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

  const handleDelete = async () => {
    if (!desk || !item) return;
    setIsDeleting(true);
    try {
      // Navigate first, then delete to avoid re-render issues
      router.push(`/desk/${slug}`);
      await deleteItem(desk.id, item.id);
    } catch (error) {
      console.error('Error deleting item:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] transition-colors">
      <Sidebar activeSlug={slug} />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href={`/desk/${slug}`}
              className="text-[var(--primary)] hover:underline text-xl font-bold"
            >
              {desk.label}
            </Link>
            <span className="text-[var(--foreground)] text-xl font-bold"> -&gt; {formData.title || 'Untitled'}</span>
          </div>
          <div className="flex items-center gap-4">
                        <UserProfileButton />
          </div>
        </div>

        {/* Item tabs */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href={`/desk/${slug}`}
            className="w-12 h-12 rounded-lg bg-[var(--card-add)] flex items-center justify-center hover:opacity-80 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[var(--text-muted)] fill-current">
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
            className="w-12 h-12 rounded-lg bg-[var(--card-add)] flex items-center justify-center hover:opacity-80 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[var(--text-muted)]">
              <path d="M12 4v16m-8-8h16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {isDecrypting ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#ffa000] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : decryptError ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-4 mb-4">
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
                    <div className="absolute left-0 top-full mt-1 bg-[var(--surface)] rounded-lg shadow-lg border border-[var(--border-color)] py-1 z-50 min-w-[140px]">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, cardViewType: 'title' });
                          setShowCardViewMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 ${formData.cardViewType === 'title' ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}`}
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
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 ${formData.cardViewType === 'image' ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}`}
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
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 ${formData.cardViewType === 'emoji' ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}`}
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
                    <label className="text-[var(--text-muted)] text-sm">Emoji</label>
                    <input
                      type="text"
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      placeholder="😀"
                      className="w-16 px-3 py-1.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm text-center"
                      maxLength={2}
                    />
                  </div>
                )}

                {/* Title */}
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[var(--text-muted)] text-sm">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="flex-1 px-3 py-1.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm"
                  />
                </div>

                {/* Link */}
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[var(--text-muted)] text-sm">Link</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="flex-1 px-3 py-1.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm"
                  />
                  <button
                    type="button"
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                    onClick={() => window.open(formData.link, '_blank')}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Description */}
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[var(--text-muted)] text-sm">Desc</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description..."
                    className="flex-1 px-3 py-1.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm placeholder-[var(--text-muted)]"
                  />
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  className="px-6 py-1.5 bg-[var(--primary)] text-white rounded-md font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm flex-shrink-0"
                >
                  Save
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors flex-shrink-0"
                  title="Delete item"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-[var(--border-color)]">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Delete Item</h3>
            <p className="text-[var(--text-muted)] mb-6">
              Are you sure you want to delete &quot;{formData.title || 'this item'}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
