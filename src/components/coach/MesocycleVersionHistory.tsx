import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMesocycleVersions } from '@/hooks/useMesocycleVersions';
import { Loader2, GitBranch, Copy, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MesocycleVersionHistoryProps {
  mesocycleId: string;
  onCloneVersion?: (versionId: string) => void;
}

export function MesocycleVersionHistory({ 
  mesocycleId, 
  onCloneVersion 
}: MesocycleVersionHistoryProps) {
  const { data: versions, isLoading } = useMesocycleVersions(mesocycleId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'volume_increase':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'volume_decrease':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'exercise_swap':
        return <GitBranch className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Historial de Versiones
        </CardTitle>
        <CardDescription>
          Clona versiones anteriores para aplicar cambios masivos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!versions || versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay versiones registradas</p>
            <p className="text-sm mt-2">Los cambios de programa se registrarán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {/* Version Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(version.created_at, { 
                          addSuffix: true,
                          locale: es 
                        })}
                      </span>
                    </div>
                    {version.changelog && (
                      <p className="text-sm font-medium">{version.changelog}</p>
                    )}
                  </div>
                  {onCloneVersion && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCloneVersion(version.id)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Clonar
                    </Button>
                  )}
                </div>

                {/* Changes List */}
                {version.changes && version.changes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Cambios:</p>
                    <div className="space-y-1">
                      {version.changes.map((change, idx) => (
                        <div 
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          {getChangeIcon(change.type)}
                          <div className="flex-1">
                            <span className="font-medium capitalize">
                              {change.type.replace('_', ' ')}
                            </span>
                            {change.affected_weeks && (
                              <span className="text-muted-foreground ml-2">
                                (Semanas: {change.affected_weeks.join(', ')})
                              </span>
                            )}
                            {change.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {change.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Author - Optional field */}
                <div className="text-xs text-muted-foreground">
                  Por: Coach
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
