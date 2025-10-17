import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, Activity } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWeeklyVolume, useAdherence, useStrengthProgression, useVolumeByMuscle } from '@/hooks/useStats';
import { useRIRDistribution } from '@/hooks/useRIRDistribution';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { MuscleVolumeTracker } from '@/components/progress/MuscleVolumeTracker';
import { StatsGrid } from '@/components/ui/stat-card';
import { PageTransition, FadeIn } from '@/components/layout/PageTransition';
import { motion } from 'framer-motion';

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

  // Stats para el grid moderno
  const progressStats = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'Volumen Semanal',
      value: `${weeklyVolume} sets`,
      change: 'Últimos 7 días',
      gradient: 'primary' as const,
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: 'Adherencia',
      value: `${adherence}%`,
      change: 'Últimas 4 semanas',
      gradient: 'success' as const,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: 'Series Totales',
      value: strengthData.length.toString(),
      change: 'Registradas',
      gradient: 'energy' as const,
    },
  ];

  return (
    <AppLayout>
      <PageTransition>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header con gradiente */}
          <FadeIn delay={0}>
            <div className="relative overflow-hidden rounded-2xl mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />
              <div className="relative glass-card p-6">
                <h1 className="text-4xl font-bold mb-2">
                  <span className="neon-text">Tu Progreso</span> 📊
                </h1>
                <p className="text-muted-foreground">
                  Análisis detallado de tu evolución y rendimiento
                </p>
              </div>
            </div>
          </FadeIn>
          
          {/* Stats Grid con componentes modernos */}
          <FadeIn delay={0.1}>
            <StatsGrid stats={progressStats} />
          </FadeIn>
        
        <Tabs defaultValue="volume">
          <TabsList>
            <TabsTrigger value="volume">Volumen</TabsTrigger>
            <TabsTrigger value="strength">Fuerza</TabsTrigger>
            <TabsTrigger value="muscles">Por Músculo</TabsTrigger>
            <TabsTrigger value="rir">Distribución RIR</TabsTrigger>
            <TabsTrigger value="analysis">Análisis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="volume" className="space-y-4">
            <FadeIn delay={0.2}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Volumen por Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sets" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </FadeIn>
          </TabsContent>
          
          <TabsContent value="strength" className="space-y-4">
            <FadeIn delay={0.2}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      Progresión de Fuerza (e1RM)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={strengthChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="e1rm" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </FadeIn>
          </TabsContent>
          
          <TabsContent value="muscles" className="space-y-4">
            <FadeIn delay={0.2}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-energy" />
                      Volumen por Grupo Muscular
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={muscleChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="muscle" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sets" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </FadeIn>
          </TabsContent>

          {/* NEW: RIR Distribution Tab */}
          <TabsContent value="rir" className="space-y-4">
            <FadeIn delay={0.2}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="glass-card">
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
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
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
                    
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <motion.div 
                        className="glass-card p-4 text-center"
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="text-xs text-muted-foreground mb-2">RIR 0-1</div>
                        <div className="text-2xl font-bold text-destructive">
                          {rirDistribution.filter(d => d.rir <= 1).reduce((sum, d) => sum + d.count, 0)} sets
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Alta intensidad 🔥</div>
                      </motion.div>
                      <motion.div 
                        className="glass-card p-4 text-center"
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="text-xs text-muted-foreground mb-2">RIR 2</div>
                        <div className="text-2xl font-bold text-warning">
                          {rirDistribution.find(d => d.rir === 2)?.count || 0} sets
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Moderado ⚡</div>
                      </motion.div>
                      <motion.div 
                        className="glass-card p-4 text-center"
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="text-xs text-muted-foreground mb-2">RIR 3-4</div>
                        <div className="text-2xl font-bold text-success">
                          {rirDistribution.filter(d => d.rir >= 3).reduce((sum, d) => sum + d.count, 0)} sets
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Conservador ✅</div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </FadeIn>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            <MuscleVolumeTracker weeks={4} />
          </TabsContent>
        </Tabs>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
