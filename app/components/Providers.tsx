'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { DesksProvider } from '../context/DesksContext';
import { EncryptionProvider } from '../context/EncryptionContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <EncryptionProvider>
        <DesksProvider>
          {children}
        </DesksProvider>
      </EncryptionProvider>
    </SessionProvider>
  );
}
