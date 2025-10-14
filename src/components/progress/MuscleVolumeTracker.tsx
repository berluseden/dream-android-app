import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useVolumeComparison } from '@/hooks/useVolumeComparison';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MuscleVolumeTrackerProps {
  userId?: string;
  weeks?: number;
}

export function MuscleVolumeTracker({ userId, weeks = 4 }: MuscleVolumeTrackerProps) {
  const { data: volumeData, isLoading } = useVolumeComparison(userId || '', weeks);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const insights = volumeData?.filter(d => d.status === 'problem') || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Volumen por Músculo (Últimas {weeks} semanas)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="muscle" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
              <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {insights.length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>Recomendaciones:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              {insights.map(d => {
                const diff = Math.abs(d.actual - d.target);
                if (d.actual < d.target * 0.8) {
                  return <li key={d.muscle}>• {d.muscle}: Añade ~{Math.ceil(diff / weeks)} sets/semana</li>;
                }
                if (d.actual > d.target * 1.2) {
                  return <li key={d.muscle}>• {d.muscle}: Reduce ~{Math.ceil(diff / weeks)} sets/semana</li>;
                }
                return null;
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}