import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useClientAdherence } from '@/hooks/useClientStats';
import { Loader2 } from 'lucide-react';

interface ClientAdherenceChartProps {
  clientId: string;
  weeks?: number;
}

export function ClientAdherenceChart({ clientId, weeks = 8 }: ClientAdherenceChartProps) {
  const { data: adherenceData, isLoading } = useClientAdherence(clientId, weeks);

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
        <CardTitle>Adherencia (Últimas {weeks} semanas)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={adherenceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover p-3 rounded-lg border shadow-sm">
                      <p className="font-semibold">{data.week}</p>
                      <p className="text-sm">Adherencia: {data.adherence}%</p>
                      <p className="text-sm text-muted-foreground">
                        Completados: {data.completed}/{data.planned}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="adherence"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                let fill = 'hsl(var(--primary))';
                if (payload.adherence < 60) fill = 'hsl(var(--destructive))';
                else if (payload.adherence < 80) fill = 'hsl(var(--warning))';
                return <circle cx={cx} cy={cy} r={4} fill={fill} />;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}