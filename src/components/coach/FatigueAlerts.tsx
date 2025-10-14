import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientFatigueAlerts } from '@/hooks/useClientStats';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface FatigueAlertsProps {
  clientId: string;
  onSuggestSubstitution?: (exerciseId: string) => void;
}

export function FatigueAlerts({ clientId, onSuggestSubstitution }: FatigueAlertsProps) {
  const { data: alerts, isLoading } = useClientFatigueAlerts(clientId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getSorenessLevel = (score: number) => {
    if (score >= 8) return { label: 'Crítico', variant: 'destructive' as const };
    if (score >= 7) return { label: 'Alto', variant: 'destructive' as const };
    return { label: 'Moderado', variant: 'secondary' as const };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alertas de Fatiga
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay alertas de fatiga</p>
            <p className="text-sm mt-2">El cliente está recuperando bien</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const level = getSorenessLevel(alert.avgSoreness);
              return (
                <div
                  key={alert.exerciseId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{alert.exerciseName}</span>
                      <Badge variant={level.variant}>{level.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Soreness promedio: {alert.avgSoreness}/10</span>
                      <span>
                        Última sesión:{' '}
                        {formatDistanceToNow(alert.lastWorkout, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>
                  {onSuggestSubstitution && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSuggestSubstitution(alert.exerciseId)}
                    >
                      Sugerir Sustitución
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}