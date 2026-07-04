'use client';

import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initializeAuth = useStore(state => state.initializeAuth);
  const theme = useStore(state => state.theme);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  return <>{children}</>;
}
