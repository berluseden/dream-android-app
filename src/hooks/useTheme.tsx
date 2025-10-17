import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

/**
 * Hook para gestionar el tema de la aplicación
 * Persiste en localStorage y aplica clases CSS
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Cargar tema desde localStorage o default 'system'
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remover clases anteriores
    root.classList.remove('light', 'dark');

    // Determinar tema efectivo
    let effectiveTheme: 'light' | 'dark' = 'light';
    
    if (theme === 'system') {
      // Detectar preferencia del sistema
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      effectiveTheme = systemTheme;
    } else {
      effectiveTheme = theme;
    }

    // Aplicar clase al root
    root.classList.add(effectiveTheme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  return { theme, setTheme };
}
