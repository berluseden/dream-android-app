import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bell, X } from 'lucide-react';
import { useState } from 'react';
import { MesocycleVersion } from '@/hooks/useMesocycleVersions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MesocycleUpdateNotificationProps {
  version: MesocycleVersion;
  onDismiss: () => void;
}

export function MesocycleUpdateNotification({
  version,
  onDismiss,
}: MesocycleUpdateNotificationProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Alert className="border-primary bg-primary/5">
        <Bell className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Actualización de tu programa</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Tu coach ha publicado cambios en tu mesociclo (v{version.version})
          </p>
          <div className="flex gap-2 flex-wrap">
            {version.changes.map((change, idx) => (
              <Badge key={idx} variant="secondary">
                {change.type === 'volume' && '📊 Volumen'}
                {change.type === 'exercise' && '💪 Ejercicios'}
                {change.type === 'schedule' && '📅 Calendario'}
                {change.type === 'other' && '✏️ Otros'}
              </Badge>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(true)}
            className="mt-2"
          >
            Ver Cambios
          </Button>
        </AlertDescription>
      </Alert>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cambios del Mesociclo (Versión {version.version})</DialogTitle>
            <DialogDescription>
              Publicado{' '}
              {formatDistanceToNow(version.created_at, { addSuffix: true, locale: es })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold mb-2">Resumen de cambios</h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {version.changelog}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Tipo de cambios</h4>
              <div className="space-y-2">
                {version.changes.map((change, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Badge variant="secondary">
                      {change.type === 'volume' && '📊 Volumen'}
                      {change.type === 'exercise' && '💪 Ejercicios'}
                      {change.type === 'schedule' && '📅 Calendario'}
                      {change.type === 'other' && '✏️ Otros'}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{change.description}</p>
                      {change.affected_weeks && change.affected_weeks.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Afecta semanas: {change.affected_weeks.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}