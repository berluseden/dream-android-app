import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientPRs } from '@/hooks/useClientStats';
import { Loader2, TrendingUp, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientPRsListProps {
  clientId: string;
  days?: number;
}

export function ClientPRsList({ clientId, days = 30 }: ClientPRsListProps) {
  const { data: prs, isLoading } = useClientPRs(clientId, days);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          PRs Recientes (Últimos {days} días)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!prs || prs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay PRs registrados</p>
            <p className="text-sm mt-2">Los récords aparecerán aquí cuando se mejoren</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prs.map((pr, index) => (
              <div
                key={pr.exerciseId}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                  {index === 1 && <Award className="h-5 w-5 text-gray-400" />}
                  {index === 2 && <Award className="h-5 w-5 text-amber-600" />}
                  {index > 2 && <TrendingUp className="h-5 w-5 text-primary" />}
                  <div>
                    <p className="font-medium">{pr.exerciseName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(pr.date, { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{pr.e1rm} kg</span>
                    <Badge variant="default" className="bg-green-500">
                      +{pr.improvement}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anterior: {pr.previousE1rm} kg
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}