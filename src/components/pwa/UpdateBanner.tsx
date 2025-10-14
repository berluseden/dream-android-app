import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          }
        });
      });

      navigator.serviceWorker.ready.then(() => {
        setOfflineReady(true);
      });
    }
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.update().then(() => {
            window.location.reload();
          });
        });
      });
    }
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!needRefresh && !offlineReady) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 shadow-lg animate-in slide-in-from-bottom" style={{ paddingBottom: 'max(1rem, var(--safe-bottom))' }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {needRefresh ? (
            <div>
              <p className="font-semibold">Nueva versión disponible</p>
              <p className="text-sm text-muted-foreground">Actualiza para obtener las últimas mejoras</p>
            </div>
          ) : (
            <p className="text-sm">App lista para funcionar offline</p>
          )}
        </div>
        <div className="flex gap-2">
          {needRefresh && (
            <Button onClick={handleUpdate} size="sm" className="tap-target">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          )}
          <Button onClick={close} size="sm" variant="ghost" className="tap-target">
            Cerrar
          </Button>
        </div>
      </div>
    </Card>
  );
}
