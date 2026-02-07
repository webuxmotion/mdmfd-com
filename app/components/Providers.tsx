'use client';

import { ReactNode } from 'react';
import { DesksProvider } from '../context/DesksContext';
import { AuthProvider } from '../context/AuthContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DesksProvider>{children}</DesksProvider>
    </AuthProvider>
  );
}
