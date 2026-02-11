'use client';

import { useState, use, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import MarkdownEditor from '../../../../components/MarkdownEditor';
import UserProfileButton from '../../../../components/UserProfileButton';
import { useDesks } from '../../../../context/DesksContext';
import { useEncryption } from '../../../../context/EncryptionContext';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();
  const {
    isUnlocked,
    encryptField,
    decryptField,
    isFieldEncrypted,
    unlockWithPassword,
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

  // Readme visibility state
  const [readmeVisible, setReadmeVisible] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isReadmeEncrypted, setIsReadmeEncrypted] = useState(false);
  const [rawEncryptedReadme, setRawEncryptedReadme] = useState<string>('');

  // Fetch fresh data from server when visiting the page
  useEffect(() => {
    const key = `${slug}-${id}`;
    if (lastFetchedRef.current !== key) {
      lastFetchedRef.current = key;
      refreshDesks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, id]);

  // Decrypt all item titles for tabs (may include legacy encrypted titles)
  useEffect(() => {
    if (!desk) return;

    const decryptAllTitles = async () => {
      const titles: Record<string, string> = {};
      for (const i of desk.items) {
        // Check if title is encrypted (legacy data)
        if (isUnlocked && isFieldEncrypted(i.title)) {
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

  // Load item data - decrypt legacy encrypted titles, readme may be encrypted
  useEffect(() => {
    if (!item) return;

    const loadItem = async () => {
      setIsDecrypting(true);
      setDecryptError(null);

      try {
        const readmeRaw = item.readme || '';
        const readmeEncrypted = isFieldEncrypted(readmeRaw);

        // Track if readme is encrypted
        setIsReadmeEncrypted(readmeEncrypted);
        setRawEncryptedReadme(readmeRaw);

        // Decrypt title if it was previously encrypted (legacy data)
        let title = item.title;
        if (isUnlocked && isFieldEncrypted(item.title)) {
          try {
            title = await decryptField(item.title);
          } catch {
            // Keep original if decryption fails
          }
        }

        // For readme: if it's encrypted, don't auto-decrypt - keep it hidden
        // If not encrypted or empty, show it directly
        let readme = readmeRaw;
        if (readmeEncrypted) {
          // Keep readme hidden (empty for now, will be decrypted when user reveals)
          readme = '';
          setReadmeVisible(false);
        } else {
          // Not encrypted, show directly
          readme = readmeRaw;
          setReadmeVisible(true);
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

    loadItem();
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
      let readmeToSave = formData.readme;

      // Only encrypt README, title stays plain text
      if (isUnlocked) {
        readmeToSave = await encryptField(formData.readme);
      }

      updateItem(desk.id, id, {
        title: formData.title,
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
    let readmeToSave = formData.readme;

    // Only encrypt README, title stays plain text
    if (isUnlocked) {
      readmeToSave = await encryptField(formData.readme);
    }

    updateItem(desk.id, id, {
      title: formData.title,
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

  // Handle readme visibility toggle
  const handleToggleReadmeVisibility = async () => {
    if (readmeVisible) {
      // Hide readme
      setReadmeVisible(false);
      return;
    }

    // User wants to show readme
    if (!isReadmeEncrypted || !rawEncryptedReadme) {
      // Not encrypted, just show it
      setReadmeVisible(true);
      return;
    }

    // Readme is encrypted - check if encryption is unlocked
    if (isUnlocked) {
      // Already unlocked, decrypt and show
      try {
        const decryptedReadme = await decryptField(rawEncryptedReadme);
        setFormData(prev => ({ ...prev, readme: decryptedReadme }));
        setReadmeVisible(true);
      } catch (error) {
        setDecryptError('Failed to decrypt readme.');
      }
    } else {
      // Need password - show password modal
      setShowPasswordModal(true);
    }
  };

  // Handle password submission to unlock and decrypt readme
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const encryptedMasterKey = (session as { encryptedMasterKey?: string })?.encryptedMasterKey;
    if (!encryptedMasterKey) {
      setPasswordError('No encryption key found. Please log in again.');
      return;
    }

    try {
      const success = await unlockWithPassword(encryptedMasterKey, passwordInput);
      if (success) {
        // Now decrypt the readme
        const decryptedReadme = await decryptField(rawEncryptedReadme);
        setFormData(prev => ({ ...prev, readme: decryptedReadme }));
        setReadmeVisible(true);
        setShowPasswordModal(false);
        setPasswordInput('');
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (error) {
      setPasswordError('Failed to decrypt. Please check your password.');
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
              masked={!readmeVisible && (isReadmeEncrypted || !!rawEncryptedReadme)}
              onToggleVisibility={handleToggleReadmeVisibility}
              isEncrypted={isReadmeEncrypted}
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

      {/* Password Modal for README decryption */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[var(--primary)] fill-current">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Unlock README</h3>
                <p className="text-[var(--text-muted)] text-sm">Enter your password to view encrypted content</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg focus:outline-none focus:border-[var(--primary)] mb-3"
                autoFocus
              />

              {passwordError && (
                <p className="text-red-500 text-sm mb-3">{passwordError}</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-md font-medium hover:bg-[var(--primary-dark)] transition-colors"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
