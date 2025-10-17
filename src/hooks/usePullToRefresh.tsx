import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Píxeles para activar
  resistance?: number; // Resistencia del pull (0-1)
}

/**
 * Hook para implementar pull-to-refresh en móviles
 * Compatible con gestos táctiles nativos
 * 
 * @example
 * const { isPulling, pullDistance } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await queryClient.invalidateQueries();
 *   },
 *   threshold: 80,
 * });
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 0.5,
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    let rafId: number;

    const handleTouchStart = (e: TouchEvent) => {
      // Solo activar si estamos en el top de la página
      if (window.scrollY > 0) return;
      
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      
      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;
      
      // Solo permitir pull hacia abajo
      if (distance > 0) {
        // Prevenir scroll nativo mientras hacemos pull
        e.preventDefault();
        
        // Aplicar resistencia para efecto elástico
        const adjustedDistance = distance * resistance;
        setPullDistance(Math.min(adjustedDistance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      
      setIsPulling(false);
      
      // Si superamos el threshold, ejecutar refresh
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        
        try {
          await onRefresh();
        } catch (error) {
          console.error('Error during pull-to-refresh:', error);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        // Animación de regreso
        setPullDistance(0);
      }
    };

    // Agregar event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPulling, isRefreshing, pullDistance, threshold, resistance, onRefresh]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    progress: Math.min((pullDistance / threshold) * 100, 100),
  };
}

/**
 * Componente visual para el indicador de pull-to-refresh
 */
interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold,
}: PullToRefreshIndicatorProps) {
  const opacity = Math.min(pullDistance / threshold, 1);
  const rotation = (pullDistance / threshold) * 360;
  const scale = Math.min(pullDistance / threshold, 1);

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
      }}
    >
      <div
        className="bg-background border rounded-full p-3 shadow-lg"
        style={{
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <RefreshCw
          className={`h-6 w-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
          }}
        />
      </div>
    </div>
  );
}
