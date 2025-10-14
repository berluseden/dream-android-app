import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientVolumeHeatmap } from '@/hooks/useClientStats';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VolumeHeatmapProps {
  clientId: string;
  mesocycleId: string;
}

export function VolumeHeatmap({ clientId, mesocycleId }: VolumeHeatmapProps) {
  const { data: heatmapData, isLoading } = useClientVolumeHeatmap(clientId, mesocycleId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Get unique muscles and weeks
  const muscles = Array.from(new Set(heatmapData?.map(d => d.muscle) || []));
  const weeks = Array.from(new Set(heatmapData?.map(d => d.week) || [])).sort((a, b) => a - b);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'attention': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'problem': return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-muted';
    }
  };

  const getCellData = (muscle: string, week: number) => {
    return heatmapData?.find(d => d.muscle === muscle && d.week === week);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor de Volumen</CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20" />
            <span className="text-muted-foreground">Óptimo (90-110%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/20" />
            <span className="text-muted-foreground">Atención (80-90% o 110-120%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20" />
            <span className="text-muted-foreground">Problema (&lt;80% o &gt;120%)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left font-medium">Músculo</th>
                {weeks.map(week => (
                  <th key={week} className="border p-2 text-center font-medium">
                    S{week}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {muscles.map(muscle => (
                <tr key={muscle}>
                  <td className="border p-2 font-medium capitalize">{muscle}</td>
                  {weeks.map(week => {
                    const cellData = getCellData(muscle, week);
                    return (
                      <td key={week} className="border p-1">
                        {cellData ? (
                          <div className={`text-center py-2 rounded ${getStatusColor(cellData.status)}`}>
                            <div className="font-bold">{cellData.sets}</div>
                            <div className="text-xs opacity-70">/{cellData.target}</div>
                          </div>
                        ) : (
                          <div className="text-center py-2 text-muted-foreground">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}