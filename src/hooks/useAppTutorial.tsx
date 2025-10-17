import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

/**
 * Hook para el tutorial interactivo de la aplicación
 * Usa react-joyride para guiar a nuevos usuarios
 */
export function useAppTutorial() {
  const [runTutorial, setRunTutorial] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Verificar si el usuario ya vio el tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      // Esperar un momento para que la UI cargue
      setTimeout(() => setRunTutorial(true), 1000);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: '¡Bienvenido a tu app de hipertrofia! 💪 Te mostraremos las funciones principales.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="today-workout"]',
      content: 'Aquí verás tu entrenamiento del día. Toca para empezar a registrar tus series.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="workouts"]',
      content: 'Revisa tu historial de entrenamientos y estadísticas.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="exercises"]',
      content: 'Explora la biblioteca de ejercicios y aprende la técnica correcta.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="progress"]',
      content: 'Monitorea tu progreso con gráficos de fuerza y volumen.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="mesocycle"]',
      content: 'Tu mesociclo actual. Aquí se programa tu volumen semanal óptimo.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="settings"]',
      content: 'Personaliza la app: unidades, tema, notificaciones y más.',
      placement: 'left',
    },
    {
      target: 'body',
      content: '¡Listo! Presiona "?" en cualquier momento para ver los atajos de teclado. ¡A entrenar! 🚀',
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Marcar como visto
      localStorage.setItem('hasSeenTutorial', 'true');
      setRunTutorial(false);
      setStepIndex(0);
    } else if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  const startTutorial = () => {
    setStepIndex(0);
    setRunTutorial(true);
  };

  const resetTutorial = () => {
    localStorage.removeItem('hasSeenTutorial');
    startTutorial();
  };

  return {
    runTutorial,
    steps,
    stepIndex,
    handleJoyrideCallback,
    startTutorial,
    resetTutorial,
  };
}

/**
 * Componente del tutorial interactivo
 * Usar en el componente raíz (App.tsx)
 */
interface AppTutorialProps {
  run?: boolean;
  onCallback?: (data: CallBackProps) => void;
}

export function AppTutorial({ run = false, onCallback }: AppTutorialProps) {
  const { runTutorial, steps, handleJoyrideCallback } = useAppTutorial();

  return (
    <Joyride
      steps={steps}
      run={run || runTutorial}
      continuous
      showProgress
      showSkipButton
      callback={onCallback || handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          arrowColor: 'hsl(var(--background))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 14,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: 6,
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: 14,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: 14,
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar',
      }}
    />
  );
}
