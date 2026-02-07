'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Desk, DeskItem, initialDesks } from '../data/desks';

interface DesksContextType {
  desks: Desk[];
  addDesk: (desk: Omit<Desk, 'id'>) => string;
  updateDesk: (id: string, updates: Partial<Desk>) => void;
  deleteDesk: (id: string) => void;
  getDesk: (id: string) => Desk | undefined;
  getDeskBySlug: (slug: string) => Desk | undefined;
  addItem: (deskId: string, item: Omit<DeskItem, 'id'>) => string;
  updateItem: (deskId: string, itemId: string, updates: Partial<DeskItem>) => void;
  deleteItem: (deskId: string, itemId: string) => void;
  getItem: (deskId: string, itemId: string) => DeskItem | undefined;
}

const DesksContext = createContext<DesksContextType | undefined>(undefined);

const STORAGE_KEY = 'mdmfd-desks';

export function DesksProvider({ children }: { children: ReactNode }) {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDesks(JSON.parse(stored));
      } catch {
        setDesks(initialDesks);
      }
    } else {
      setDesks(initialDesks);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when desks change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(desks));
    }
  }, [desks, isLoaded]);

  const addDesk = (desk: Omit<Desk, 'id'>): string => {
    const id = String(Date.now());
    const newDesk: Desk = { ...desk, id };
    setDesks(prev => [...prev, newDesk]);
    return id;
  };

  const updateDesk = (id: string, updates: Partial<Desk>) => {
    setDesks(prev =>
      prev.map(d => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const deleteDesk = (id: string) => {
    setDesks(prev => prev.filter(d => d.id !== id));
  };

  const getDesk = (id: string) => {
    return desks.find(d => d.id === id);
  };

  const getDeskBySlug = (slug: string) => {
    return desks.find(d => d.slug === slug);
  };

  const addItem = (deskId: string, item: Omit<DeskItem, 'id'>): string => {
    const id = String(Date.now());
    const newItem: DeskItem = { ...item, id };
    setDesks(prev =>
      prev.map(d =>
        d.id === deskId ? { ...d, items: [...d.items, newItem] } : d
      )
    );
    return id;
  };

  const updateItem = (deskId: string, itemId: string, updates: Partial<DeskItem>) => {
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
  };

  const deleteItem = (deskId: string, itemId: string) => {
    setDesks(prev =>
      prev.map(d =>
        d.id === deskId
          ? { ...d, items: d.items.filter(item => item.id !== itemId) }
          : d
      )
    );
  };

  const getItem = (deskId: string, itemId: string) => {
    const desk = desks.find(d => d.id === deskId);
    return desk?.items.find(item => item.id === itemId);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <DesksContext.Provider
      value={{
        desks,
        addDesk,
        updateDesk,
        deleteDesk,
        getDesk,
        getDeskBySlug,
        addItem,
        updateItem,
        deleteItem,
        getItem,
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
