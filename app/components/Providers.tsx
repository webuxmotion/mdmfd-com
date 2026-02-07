'use client';

import { ReactNode } from 'react';
import { DesksProvider } from '../context/DesksContext';

export default function Providers({ children }: { children: ReactNode }) {
  return <DesksProvider>{children}</DesksProvider>;
}
