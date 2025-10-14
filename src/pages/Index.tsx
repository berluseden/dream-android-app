import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { runSeed } from '@/scripts/seedFirestore';
import { useState, useMemo } from 'react';
import { 
  Loader2, 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
  Target, 
  Plus, 
  Play, 
  Flame,
  Award,
  Zap,
  ArrowRight,
  Activity,
  Moon,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { useActiveMesocycle, useWeeklyTargets } from '@/hooks/useMesocycles';
import { useTodayWorkout } from '@/hooks/useWorkouts';
import { useWeeklyVolume, useAdherence, useVolumeByMuscle } from '@/hooks/useStats';
import { useStrengthProfile } from '@/hooks/useStrengthProfile';
import { useExercises } from '@/hooks/useExercises';
import { useRecentAdjustments } from '@/hooks/useRecentAdjustments';
import { useWeeklySummary } from '@/hooks/useWeeklySummary';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Cell
} from 'recharts';

const Index = () => {
  const { profile, role, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();
  const { data: activeMesocycle } = useActiveMesocycle();
  const { data: todayWorkout } = useTodayWorkout();
  const { data: weeklyVolume } = useWeeklyVolume();
  const { data: adherence } = useAdherence();
  const { hasCompletedCalibration, isLoading: isLoadingProfile } = useStrengthProfile();
  const { data: weeklyTargets } = useWeeklyTargets(activeMesocycle?.id || '');
  const { data: volumeByMuscle } = useVolumeByMuscle(undefined, 1); // Current week
  const { data: exercises } = useExercises();
  
  // New hooks for Sprint 1
  const { data: recentAdjustments } = useRecentAdjustments(user?.uid || '', 5);
  const { data: weeklySummary } = useWeeklySummary(user?.uid || '');

  // Calculate current week number
  const currentWeek = useMemo(() => {
    if (!activeMesocycle?.start_date) return 1;
    const start = new Date(activeMesocycle.start_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.min(diffWeeks, activeMesocycle.length_weeks);
  }, [activeMesocycle]);

  // Check if current week is deload (last week)
  const isDeloadWeek = currentWeek === activeMesocycle?.length_weeks;

  // Prepare volume chart data (grouped by muscle)
  const volumeChartData = useMemo(() => {
    if (!weeklyTargets || !exercises) return [];
    
    const muscleMap = new Map<string, { planned: number; actual: number; name: string }>();
    
    weeklyTargets
      .filter(t => t.week_number === currentWeek)
      .forEach(target => {
        const muscle = exercises.find(e => e.prime_muscle === target.muscle_id);
        const muscleName = muscle?.prime_muscle || target.muscle_id;
        
        const existing = muscleMap.get(muscleName) || { planned: 0, actual: 0, name: muscleName };
        existing.planned += target.sets_target;
        existing.actual += volumeByMuscle?.[target.muscle_id] || 0;
        muscleMap.set(muscleName, existing);
      });
    
    return Array.from(muscleMap.values()).map(m => ({
      muscle: m.name,
      planificado: m.planned,
      realizado: m.actual,
      adherencia: m.planned > 0 ? Math.round((m.actual / m.planned) * 100) : 0
    }));
  }, [weeklyTargets, volumeByMuscle, exercises, currentWeek]);

  // Calculate total volume and adherence
  const totalStats = useMemo(() => {
    const totalPlanned = volumeChartData.reduce((sum, d) => sum + d.planificado, 0);
    const totalActual = volumeChartData.reduce((sum, d) => sum + d.realizado, 0);
    const overallAdherence = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
    
    return { totalPlanned, totalActual, overallAdherence };
  }, [volumeChartData]);

  // Fatigue progression data (mock - would need real RIR tracking)
  const fatigueData = useMemo(() => {
    return Array.from({ length: currentWeek }, (_, i) => ({
      semana: i + 1,
      rir: 3 - (i * 0.4), // Simulated decreasing RIR
      fatiga: i < currentWeek - 1 ? ((i + 1) / currentWeek) * 100 : isDeloadWeek ? 20 : 80
    }));
  }, [currentWeek, isDeloadWeek]);

  const getFatigueLevel = (week: number) => {
    if (week === activeMesocycle?.length_weeks) return 'Deload';
    if (week >= (activeMesocycle?.length_weeks || 6) - 1) return 'Alta';
    if (week >= 3) return 'Moderada';
    return 'Baja';
  };

  const handleSeed = async () => {
    setSeeding(true);
    const result = await runSeed();
    setSeeding(false);
    
    if (result.success) {
      toast({
        title: "Seed completado",
        description: "Músculos y ejercicios creados correctamente",
      });
    } else {
      toast({
        title: "Error en seed",
        description: "Revisa la consola para más detalles",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
        {/* old_hero_header */}
        {/* Hero Header with Mesocycle Summary */}
        {activeMesocycle ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-6 md:p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isDeloadWeek && <Moon className="h-5 w-5" />}
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {activeMesocycle.status === 'active' ? 'Activo' : activeMesocycle.status}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {activeMesocycle.effort_scale}
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">
                    {activeMesocycle.name}
                  </h1>
                  <p className="text-white/80 text-sm mb-3">
                    Semana {currentWeek} de {activeMesocycle.length_weeks} 
                    {isDeloadWeek && ' • Deload'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(activeMesocycle.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{activeMesocycle.specialization.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats Bar */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                <div>
                  <div className="text-2xl font-bold">{totalStats.totalActual}</div>
                  <div className="text-xs text-white/70">Sets Totales</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalStats.overallAdherence}%</div>
                  <div className="text-xs text-white/70">Adherencia</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">+{(adherence || 0) / 10}%</div>
                  <div className="text-xs text-white/70">e1RM Promedio</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-6 md:p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-6 w-6" />
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {role}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                ¡Hola, {profile?.name}!
              </h1>
              <p className="text-white/90 text-lg">
                Listo para alcanzar tus objetivos de hoy
              </p>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
              <Dumbbell className="h-full w-full" />
            </div>
          </div>
        )}

        {/* Calibration Alert */}
        {!isLoadingProfile && !hasCompletedCalibration() && (
          <Alert className="border-warning bg-warning-light">
            <Activity className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning-foreground">Calibra tu Fuerza Inicial</AlertTitle>
            <AlertDescription className="text-warning-foreground/90">
              Completa la calibración de 4 ejercicios clave para obtener recomendaciones de carga más precisas
            </AlertDescription>
            <Button
              variant="default"
              size="sm"
              className="mt-3"
              onClick={() => navigate('/onboarding/calibration')}
            >
              Comenzar Calibración
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* Main Content - Mesocycle Analysis */}
        {activeMesocycle ? (
          <div className="space-y-6">
            {/* Volume Chart - Planned vs Actual */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Volumen Planificado vs Realizado
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Semana {currentWeek} • {isDeloadWeek ? 'Deload' : 'Acumulación'}
                    </CardDescription>
                  </div>
                  {isDeloadWeek && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      <Moon className="h-3 w-3 mr-1" />
                      Deload
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={volumeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="muscle" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      label={{ value: 'Sets', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [
                        value, 
                        name === 'planificado' ? 'Planificado' : 'Realizado'
                      ]}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => value === 'planificado' ? 'Planificado' : 'Realizado'}
                    />
                    <Bar dataKey="planificado" fill="hsl(var(--primary))" opacity={0.3} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realizado" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fatigue Progression */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  Progresión de Fatiga (RIR Promedio)
                </CardTitle>
                <CardDescription>
                  Fatiga actual: <span className="font-bold text-foreground">{getFatigueLevel(currentWeek)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={fatigueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="semana" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      label={{ value: 'Semana', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={[0, 4]}
                      label={{ value: 'RIR', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toFixed(1), 'RIR']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rir" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--warning))', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-secondary" />
                  Resumen Semana {currentWeek}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Músculo</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Plan</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Real</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Δ</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Adherencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volumeChartData.map((row, idx) => {
                        const delta = row.realizado - row.planificado;
                        const isOver = delta > 0;
                        const isUnder = delta < 0;
                        
                        return (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-2 font-medium capitalize">{row.muscle}</td>
                            <td className="text-center py-3 px-2 text-muted-foreground">{row.planificado}</td>
                            <td className="text-center py-3 px-2 font-bold">{row.realizado}</td>
                            <td className="text-center py-3 px-2">
                              <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                                isOver ? 'text-success' : isUnder ? 'text-destructive' : 'text-muted-foreground'
                              }`}>
                                {isOver && <ArrowUp className="h-3 w-3" />}
                                {isUnder && <ArrowDown className="h-3 w-3" />}
                                {delta > 0 ? '+' : ''}{delta}
                              </span>
                            </td>
                            <td className="text-right py-3 px-2">
                              <Badge 
                                variant={row.adherencia >= 90 ? 'default' : row.adherencia >= 70 ? 'secondary' : 'destructive'}
                                className={
                                  row.adherencia >= 90 ? 'bg-success/10 text-success border-success/20' :
                                  row.adherencia >= 70 ? 'bg-warning/10 text-warning border-warning/20' :
                                  'bg-destructive/10 text-destructive border-destructive/20'
                                }
                              >
                                {row.adherencia}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* NEW: Weekly KPIs Summary */}
            {weeklySummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Resumen Semanal (KPIs)
                  </CardTitle>
                  <CardDescription>
                    Últimos 7 días
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Adherencia */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>Adherencia</span>
                      </div>
                      <div className={`text-2xl font-bold ${
                        weeklySummary.adherence >= 90 ? 'text-success' :
                        weeklySummary.adherence >= 70 ? 'text-warning' :
                        'text-destructive'
                      }`}>
                        {weeklySummary.adherence}%
                      </div>
                    </div>

                    {/* Volumen Total */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Flame className="h-4 w-4" />
                        <span>Volumen</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {weeklySummary.totalVolume} sets
                      </div>
                    </div>

                    {/* Fatiga Promedio */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Moon className="h-4 w-4" />
                        <span>RIR Promedio</span>
                      </div>
                      <div className={`text-2xl font-bold ${
                        weeklySummary.avgFatigue <= 1 ? 'text-destructive' :
                        weeklySummary.avgFatigue <= 2 ? 'text-warning' :
                        'text-success'
                      }`}>
                        {weeklySummary.avgFatigue}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {weeklySummary.avgFatigue <= 1 ? 'Fatiga Alta' :
                         weeklySummary.avgFatigue <= 2 ? 'Fatiga Moderada' :
                         'Fatiga Baja'}
                      </p>
                    </div>

                    {/* Cambio e1RM */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Δ e1RM</span>
                      </div>
                      <div className={`text-2xl font-bold flex items-center gap-1 ${
                        weeklySummary.e1rmChange > 0 ? 'text-success' :
                        weeklySummary.e1rmChange < 0 ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {weeklySummary.e1rmChange > 0 && <ArrowUp className="h-5 w-5" />}
                        {weeklySummary.e1rmChange < 0 && <ArrowDown className="h-5 w-5" />}
                        {weeklySummary.e1rmChange > 0 ? '+' : ''}{weeklySummary.e1rmChange}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NEW: Recent Load Adjustments */}
            {recentAdjustments && recentAdjustments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Ajustes Recientes de Carga
                  </CardTitle>
                  <CardDescription>
                    Últimos {recentAdjustments.length} ajustes automáticos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAdjustments.map((adjustment) => (
                      <div 
                        key={adjustment.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{adjustment.exercise_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {adjustment.load}kg × {adjustment.reps}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {adjustment.adjustment_reason}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(adjustment.created_at, { 
                            addSuffix: true,
                            locale: es 
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {/* old_main_content */}
        {/* Today's Workout & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{/* old_today_workout */}
          {/* Today's Workout */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Entrenamiento de Hoy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {todayWorkout ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success/10 text-success border-success/20">
                      {todayWorkout.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Día {todayWorkout.day_index}
                    </span>
                  </div>
                  <Button 
                    onClick={() => navigate('/workout/today')} 
                    className="w-full bg-gradient-primary hover:opacity-90 transition-opacity group"
                    size="lg"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Iniciar Entrenamiento
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Sin entrenamiento programado</p>
                    <p className="text-sm text-muted-foreground">
                      Crea un mesociclo para comenzar
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Mesocycle Progress */}
          {activeMesocycle ? (
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-success opacity-10 rounded-full -mr-16 -mt-16" />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-success" />
                  <CardTitle>Resumen del Ciclo</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">{activeMesocycle.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {activeMesocycle.length_weeks} semanas
                      </Badge>
                      <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20">
                        {activeMesocycle.effort_scale}
                      </Badge>
                      {isDeloadWeek && (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          <Moon className="h-3 w-3 mr-1" />
                          Deload
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{Math.round((currentWeek / activeMesocycle.length_weeks) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(currentWeek / activeMesocycle.length_weeks) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Bottom Stats */}
                  <Separator />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-success">{totalStats.totalActual}</div>
                      <div className="text-xs text-muted-foreground">Sets</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{totalStats.overallAdherence}%</div>
                      <div className="text-xs text-muted-foreground">Adherencia</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-warning">{getFatigueLevel(currentWeek)}</div>
                      <div className="text-xs text-muted-foreground">Fatiga</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-success opacity-10 rounded-full -mr-16 -mt-16" />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-success" />
                  <CardTitle>Mesociclo Actual</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Award className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Sin mesociclo activo</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comienza tu planificación
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/mesocycles/create')}
                    variant="outline"
                    className="group"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Mesociclo
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Admin Tools */}
        {isAdmin && (
          <Card className="border-warning/20">
            <CardHeader>
              <CardTitle className="text-warning flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Herramientas de Administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSeed} 
                disabled={seeding}
                variant="outline"
                className="border-warning/20 hover:bg-warning/5"
              >
                {seeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ejecutar Seed de Datos Iniciales
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
