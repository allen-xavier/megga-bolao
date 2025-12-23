'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { SWRConfig } from 'swr';

const swrConfig = {
  refreshInterval: 15000,
  revalidateOnFocus: true,
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig value={swrConfig}>{children}</SWRConfig>
    </SessionProvider>
  );
}
