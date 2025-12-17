import type { ComponentType, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from './queryClient';
import { AuthProvider } from './AuthContext';
import { LanguageProvider } from './LanguageContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const HelmetProviderComponent = HelmetProvider as unknown as ComponentType<{ children?: ReactNode }>;

  return (
    <HelmetProviderComponent>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProviderComponent>
  );
}
