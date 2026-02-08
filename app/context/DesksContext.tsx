'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Desk, DeskItem, initialDesks } from '../data/desks';

const STORAGE_KEY = 'mdmfd_guest_desks';

interface DesksContextType {
  desks: Desk[];
  error: string | null;
  isLoading: boolean;
  isGuest: boolean;
  addDesk: (desk: Omit<Desk, 'id'>) => Promise<string>;
  updateDesk: (id: string, updates: Partial<Desk>) => Promise<void>;
  deleteDesk: (id: string) => Promise<void>;
  getDesk: (id: string) => Desk | undefined;
  getDeskBySlug: (slug: string) => Desk | undefined;
  addItem: (deskId: string, item: Omit<DeskItem, 'id'>) => Promise<string>;
  updateItem: (deskId: string, itemId: string, updates: Partial<DeskItem>) => Promise<void>;
  deleteItem: (deskId: string, itemId: string) => Promise<void>;
  getItem: (deskId: string, itemId: string) => DeskItem | undefined;
  refreshDesks: () => Promise<void>;
}

const DesksContext = createContext<DesksContextType | undefined>(undefined);

function getGuestDesks(): Desk[] {
  if (typeof window === 'undefined') return initialDesks;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialDesks;
    }
  }
  return initialDesks;
}

function saveGuestDesks(desks: Desk[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(desks));
  }
}

export function DesksProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [desks, setDesks] = useState<Desk[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGuest = status === 'unauthenticated';
  const isAuthLoading = status === 'loading';

  const fetchDesks = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);

    if (isGuest) {
      const guestDesks = getGuestDesks();
      setDesks(guestDesks);
      setIsLoading(false);
      setIsLoaded(true);
      return;
    }

    try {
      const response = await fetch('/api/desks');
      if (response.ok) {
        const data = await response.json();
        setDesks(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to connect to database. Please check your MongoDB connection.');
      }
    } catch (err) {
      console.error('Error fetching desks:', err);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [isGuest, isAuthLoading]);

  useEffect(() => {
    fetchDesks();
  }, [fetchDesks]);

  const refreshDesks = async () => {
    await fetchDesks();
  };

  const addDesk = async (desk: Omit<Desk, 'id'>): Promise<string> => {
    const newId = String(Date.now());
    const newDesk = { ...desk, id: newId } as Desk;

    if (isGuest) {
      const updatedDesks = [...desks, newDesk];
      setDesks(updatedDesks);
      saveGuestDesks(updatedDesks);
      return newId;
    }

    try {
      const response = await fetch('/api/desks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(desk),
      });

      if (response.ok) {
        const createdDesk = await response.json();
        setDesks(prev => [...prev, createdDesk]);
        return createdDesk.id;
      }
    } catch (err) {
      console.error('Error adding desk:', err);
    }
    return '';
  };

  const updateDesk = async (id: string, updates: Partial<Desk>) => {
    if (isGuest) {
      const updatedDesks = desks.map(d => (d.id === id ? { ...d, ...updates } : d));
      setDesks(updatedDesks);
      saveGuestDesks(updatedDesks);
      return;
    }

    try {
      const response = await fetch(`/api/desks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setDesks(prev =>
          prev.map(d => (d.id === id ? { ...d, ...updates } : d))
        );
      }
    } catch (err) {
      console.error('Error updating desk:', err);
    }
  };

  const deleteDesk = async (id: string) => {
    if (isGuest) {
      const updatedDesks = desks.filter(d => d.id !== id);
      setDesks(updatedDesks);
      saveGuestDesks(updatedDesks);
      return;
    }

    try {
      const response = await fetch(`/api/desks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDesks(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Error deleting desk:', err);
    }
  };

  const getDesk = (id: string) => {
    return desks.find(d => d.id === id);
  };

  const getDeskBySlug = (slug: string) => {
    return desks.find(d => d.slug === slug);
  };

  const addItem = async (deskId: string, item: Omit<DeskItem, 'id'>): Promise<string> => {
    const newId = String(Date.now());
    const newItem = { ...item, id: newId } as DeskItem;

    if (isGuest) {
      const updatedDesks = desks.map(d =>
        d.id === deskId ? { ...d, items: [...d.items, newItem] } : d
      );
      setDesks(updatedDesks);
      saveGuestDesks(updatedDesks);
      return newId;
    }

    try {
      const response = await fetch(`/api/desks/${deskId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        const createdItem = await response.json();
        setDesks(prev =>
          prev.map(d =>
            d.id === deskId ? { ...d, items: [...d.items, createdItem] } : d
          )
        );
        return createdItem.id;
      }
    } catch (err) {
      console.error('Error adding item:', err);
    }
    return '';
  };

  const updateItem = async (deskId: string, itemId: string, updates: Partial<DeskItem>) => {
    if (isGuest) {
      const updatedDesks = desks.map(d =>
        d.id === deskId
          ? {
              ...d,
              items: d.items.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : d
      );
      setDesks(updatedDesks);
      saveGuestDesks(updatedDesks);
      return;
    }

    try {
      const response = await fetch(`/api/desks/${deskId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setDesks(prev =>
          prev.map(d =>
            d.id === deskId
              ? {
                  ...d,
                  items: d.items.map(item =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                }
              : d
          )
        );
      }
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const deleteItem = async (deskId: string, itemId: string) => {
    if (isGuest) {
      const updatedDesks = desks.map(d =>
        d.id === deskId
          ? { ...d, items: d.items.filter(item => item.id !== itemId) }
          : d
      );
      setDesks(updatedDesks);
      saveGuestDesks(updatedDesks);
      return;
    }

    try {
      const response = await fetch(`/api/desks/${deskId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDesks(prev =>
          prev.map(d =>
            d.id === deskId
              ? { ...d, items: d.items.filter(item => item.id !== itemId) }
              : d
          )
        );
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const getItem = (deskId: string, itemId: string) => {
    const desk = desks.find(d => d.id === deskId);
    return desk?.items.find(item => item.id === itemId);
  };

  if (!isLoaded || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ffa000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-500 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchDesks()}
            className="px-6 py-2 bg-[#ffa000] text-white rounded-lg font-medium hover:bg-[#ff8f00] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <DesksContext.Provider
      value={{
        desks,
        error,
        isLoading,
        isGuest,
        addDesk,
        updateDesk,
        deleteDesk,
        getDesk,
        getDeskBySlug,
        addItem,
        updateItem,
        deleteItem,
        getItem,
        refreshDesks,
      }}
    >
      {children}
    </DesksContext.Provider>
  );
}

export function useDesks() {
  const context = useContext(DesksContext);
  if (context === undefined) {
    throw new Error('useDesks must be used within a DesksProvider');
  }
  return context;
}
