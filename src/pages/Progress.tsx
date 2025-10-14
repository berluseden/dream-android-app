import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, Activity } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWeeklyVolume, useAdherence, useStrengthProgression, useVolumeByMuscle } from '@/hooks/useStats';
import { useRIRDistribution } from '@/hooks/useRIRDistribution';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { MuscleVolumeTracker } from '@/components/progress/MuscleVolumeTracker';

export default function Progress() {
  const { user } = useAuth();
  const { data: weeklyVolume = 0 } = useWeeklyVolume();
  const { data: adherence = 0 } = useAdherence();
  const { data: strengthData = [] } = useStrengthProgression();
  const { data: volumeByMuscle = {} } = useVolumeByMuscle();
  const { data: rirDistribution = [] } = useRIRDistribution(user?.uid || '', 4);

  // Mock weekly volume data (últimas 8 semanas)
  const weeklyVolumeData = Array.from({ length: 8 }, (_, i) => ({
    week: `S${i + 1}`,
    sets: Math.floor(Math.random() * 50) + 100,
  }));

  // Process strength data for chart
  const strengthChartData = strengthData.slice(0, 15).reverse().map((item, i) => ({
    day: `D${i + 1}`,
    e1rm: Math.round(item.e1rm),
  }));

  // Process muscle volume data
  const muscleChartData = Object.entries(volumeByMuscle).map(([muscleId, sets]) => ({
    muscle: muscleId.substring(0, 10),
    sets: sets,
  }));

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Progreso</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volumen Semanal</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyVolume} sets</div>
              <p className="text-xs text-muted-foreground">Últimos 7 días</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adherencia</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adherence}%</div>
              <p className="text-xs text-muted-foreground">Últimas 4 semanas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Series Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{strengthData.length}</div>
              <p className="text-xs text-muted-foreground">Registradas</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="volume">
          <TabsList>
            <TabsTrigger value="volume">Volumen</TabsTrigger>
            <TabsTrigger value="strength">Fuerza</TabsTrigger>
            <TabsTrigger value="muscles">Por Músculo</TabsTrigger>
            <TabsTrigger value="rir">Distribución RIR</TabsTrigger>
            <TabsTrigger value="analysis">Análisis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="volume" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Volumen por Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sets" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="strength" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progresión de Fuerza (e1RM)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={strengthChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="e1rm" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="muscles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Volumen por Grupo Muscular</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={muscleChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="muscle" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sets" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEW: RIR Distribution Tab */}
          <TabsContent value="rir" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Distribución de Esfuerzo (RIR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rirDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="rir" 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'RIR', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Sets', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const item = rirDistribution.find(d => d.rir === props.payload.rir);
                        return [
                          `${value} sets (${item?.percentage || 0}%)`,
                          `RIR ${props.payload.rir}`
                        ];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                      {rirDistribution.map((entry, index) => {
                        // Color by RIR: 0-1 = red, 2 = yellow, 3-4 = green
                        const color = entry.rir <= 1 ? 'hsl(var(--destructive))' :
                                      entry.rir === 2 ? 'hsl(var(--warning))' :
                                      'hsl(var(--success))';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">RIR 0-1</div>
                    <div className="text-lg font-bold text-destructive">
                      {rirDistribution.filter(d => d.rir <= 1).reduce((sum, d) => sum + d.count, 0)} sets
                    </div>
                    <div className="text-xs text-muted-foreground">Alta intensidad</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">RIR 2</div>
                    <div className="text-lg font-bold text-warning">
                      {rirDistribution.find(d => d.rir === 2)?.count || 0} sets
                    </div>
                    <div className="text-xs text-muted-foreground">Moderado</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">RIR 3-4</div>
                    <div className="text-lg font-bold text-success">
                      {rirDistribution.filter(d => d.rir >= 3).reduce((sum, d) => sum + d.count, 0)} sets
                    </div>
                    <div className="text-xs text-muted-foreground">Conservador</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            <MuscleVolumeTracker weeks={4} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
