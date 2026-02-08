'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { DesksProvider } from '../context/DesksContext';
import { EncryptionProvider } from '../context/EncryptionContext';
import { ThemeProvider } from '../context/ThemeContext';
import { DndProvider } from '../context/DndContext';
import UnlockModal from './UnlockModal';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <EncryptionProvider>
          <UnlockModal />
          <DesksProvider>
            <DndProvider>
              {children}
            </DndProvider>
          </DesksProvider>
        </EncryptionProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
