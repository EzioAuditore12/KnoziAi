import { useUniwind, Uniwind } from 'uniwind';

export function useColorScheme() {
  const { theme } = useUniwind();
  return {
    colorScheme: theme,
    isDarkColorScheme: theme === 'dark',
    setColorScheme: (newTheme: "light" | "dark" | "system") => Uniwind.setTheme(newTheme),
    toggleColorScheme: () => Uniwind.setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}
