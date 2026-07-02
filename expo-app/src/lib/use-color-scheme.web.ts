import { useEffect, useState } from 'react';
import { Uniwind, useUniwind } from 'uniwind';

export function useColorScheme() {
  const { theme } = useUniwind();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState calls in useEffect,
    // which can trigger cascading renders and ESLint errors.
    const timeout = setTimeout(() => {
      setHasHydrated(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  // During SSR or first client render, default to 'light' to match server-rendered HTML
  const currentTheme = hasHydrated ? theme : 'light';

  return {
    colorScheme: currentTheme,
    isDarkColorScheme: currentTheme === 'dark',
    setColorScheme: (newTheme: 'light' | 'dark' | 'system') => Uniwind.setTheme(newTheme),
    toggleColorScheme: () => Uniwind.setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}
