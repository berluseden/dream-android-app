import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notify } from '@/lib/notifications';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

/**
 * Hook para atajos de teclado globales
 * Implementa navegación rápida y acciones comunes
 * 
 * Atajos disponibles:
 * - h: Home
 * - w: Workouts
 * - e: Exercises
 * - t: Today's workout
 * - p: Progress
 * - s: Settings
 * - /: Search (focus)
 * - ?: Show shortcuts help
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'h',
      description: 'Ir a inicio',
      action: () => navigate('/'),
    },
    {
      key: 'w',
      description: 'Ver entrenamientos',
      action: () => navigate('/workouts'),
    },
    {
      key: 'e',
      description: 'Ver ejercicios',
      action: () => navigate('/exercises'),
    },
    {
      key: 't',
      description: 'Entrenamiento de hoy',
      action: () => navigate('/today'),
    },
    {
      key: 'p',
      description: 'Ver progreso',
      action: () => navigate('/progress'),
    },
    {
      key: 's',
      description: 'Configuración',
      action: () => navigate('/settings'),
    },
    {
      key: 'm',
      description: 'Mensajes',
      action: () => navigate('/messages'),
    },
    {
      key: '?',
      description: 'Mostrar atajos',
      action: () => showShortcutsHelp(),
      shiftKey: true,
    },
  ];

  const showShortcutsHelp = () => {
    notify.info(
      'Atajos de teclado',
      shortcuts
        .filter(s => s.key !== '?')
        .map(s => `${s.key.toUpperCase()}: ${s.description}`)
        .join('\n')
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si estamos en un input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Buscar shortcut coincidente
      const shortcut = shortcuts.find(s => {
        const keyMatches = e.key.toLowerCase() === s.key.toLowerCase();
        const ctrlMatches = s.ctrlKey ? e.ctrlKey : !e.ctrlKey;
        const altMatches = s.altKey ? e.altKey : !e.altKey;
        const shiftMatches = s.shiftKey ? e.shiftKey : !e.shiftKey;

        return keyMatches && ctrlMatches && altMatches && shiftMatches;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return { shortcuts, showShortcutsHelp };
}

/**
 * Componente para mostrar atajos de teclado en la UI
 */
export function KeyboardShortcutsHelp() {
  const { shortcuts } = useKeyboardShortcuts();

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground">Atajos de teclado</h3>
      <div className="grid gap-2">
        {shortcuts
          .filter(s => s.key !== '?')
          .map(shortcut => (
            <div key={shortcut.key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                {shortcut.shiftKey && 'Shift + '}
                {shortcut.ctrlKey && 'Ctrl + '}
                {shortcut.altKey && 'Alt + '}
                {shortcut.key.toUpperCase()}
              </kbd>
            </div>
          ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        💡 Presiona <kbd className="px-1 py-0.5 text-xs bg-gray-100 border rounded dark:bg-gray-600">?</kbd> para ver esta ayuda en cualquier momento
      </p>
    </div>
  );
}
