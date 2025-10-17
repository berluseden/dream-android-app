import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useActiveMesocycle } from '@/hooks/useMesocycles';
import { useTodayWorkout } from '@/hooks/useWorkouts';
import { useWeeklySummary } from '@/hooks/useWeeklySummary';
import { useStrengthProfile } from '@/hooks/useStrengthProfile';
import { Button } from '@/components/ui/button';
import { StatsGrid } from '@/components/ui/stat-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { InteractiveCard, FloatingCard } from '@/components/ui/interactive-card';
import { PageTransition, FadeIn } from '@/components/layout/PageTransition';
import { useAchievements, sampleAchievements } from '@/components/gamification/AchievementSystem';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  TrendingUp, 
  Calendar, 
  Target,
  Flame,
  Zap,
  PlayCircle,
  ChevronRight,
  Award,
  Activity,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * 🏠 Dashboard Principal - Versión Moderna
 * Diseño inmersivo con glassmorphism, animaciones y gamificación
 */
export default function ModernDashboard() {
  const { profile, user } = useAuth();
  const { data: activeMesocycle } = useActiveMesocycle();
  const { data: todayWorkout } = useTodayWorkout();
  const { data: weeklySummary } = useWeeklySummary(user?.uid || '');
  const { hasCompletedCalibration } = useStrengthProfile();
  const { unlockAchievement, AchievementDisplay } = useAchievements();
  const navigate = useNavigate();
  
  // Calcular estadísticas de la semana
  const weekProgress = weeklySummary?.adherence || 0;
  const totalVolume = weeklySummary?.totalVolume || 0;
  const avgFatigue = weeklySummary?.avgFatigue || 0;
  const e1rmChange = weeklySummary?.e1rmChange || 0;
  const streak = 0; // TODO: Implementar racha en el futuro
  
  // Stats para el grid
  const dashboardStats = [
    {
      icon: <Flame className="h-5 w-5" />,
      label: 'Racha Actual',
      value: `${streak} días`,
      change: '+2 vs semana pasada',
      gradient: 'energy' as const,
    },
    {
      icon: <Dumbbell className="h-5 w-5" />,
      label: 'Volumen Total',
      value: `${Math.round(totalVolume)} kg`,
      change: '+15% vs anterior',
      gradient: 'primary' as const,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: 'Fatiga Promedio',
      value: avgFatigue.toFixed(1),
      change: 'Intensidad óptima',
      gradient: 'success' as const,
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: 'Cambio e1RM',
      value: `${e1rmChange > 0 ? '+' : ''}${e1rmChange.toFixed(1)}%`,
      change: 'Próximo: Centurión',
      gradient: 'power' as const,
    },
  ];
  
  // Simular desbloqueo de logro (demo)
  const handleStartWorkout = () => {
    if (!hasCompletedCalibration) {
      navigate('/onboarding/calibration');
      return;
    }
    
    if (todayWorkout) {
      navigate('/today');
      // Demo: unlock achievement on first workout
      if (totalVolume === 0) {
        setTimeout(() => {
          unlockAchievement(sampleAchievements[0]);
        }, 1000);
      }
    }
  };
  
  return (
    <AppLayout>
      <PageTransition>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          {/* Achievement Display */}
          {AchievementDisplay}
          
          {/* Hero Section con gradiente */}
          <FadeIn delay={0}>
            <div className="relative overflow-hidden rounded-3xl">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              
              {/* Content */}
              <div className="relative glass-card p-8 md:p-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Hola, <span className="neon-text">{profile?.name || 'Atleta'}</span> 💪
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    {todayWorkout 
                      ? '¡Es hora de entrenar! Tu cuerpo está listo para la acción.' 
                      : '¡Excelente trabajo! Ya completaste tu entrenamiento.'}
                  </p>
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-4">
                    {todayWorkout ? (
                      <Button
                        size="lg"
                        onClick={handleStartWorkout}
                        className="btn-gradient gap-2 text-lg px-8"
                      >
                        <PlayCircle className="h-6 w-6" />
                        Iniciar Entrenamiento
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/progress')}
                        className="gap-2 text-lg px-8"
                      >
                        <Activity className="h-6 w-6" />
                        Ver Mi Progreso
                      </Button>
                    )}
                    
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate('/mesocycles/create')}
                      className="gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Nuevo Mesociclo
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </FadeIn>
          
          {/* Stats Grid */}
          <FadeIn delay={0.2}>
            <StatsGrid stats={dashboardStats} />
          </FadeIn>
          
          {/* Progress Section */}
          <FadeIn delay={0.3}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Weekly Progress */}
              <FloatingCard delay={0.4}>
                <InteractiveCard
                  title="Progreso Semanal"
                  icon={<Calendar className="h-5 w-5" />}
                  gradient="from-teal-500 to-green-500"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <p className="text-3xl font-bold mb-2">
                        {Math.round(weekProgress)}%
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {weekProgress >= 80 ? '¡Excelente' : weekProgress >= 50 ? 'Buen' : 'Continúa'} adherencia esta semana
                      </p>
                      <div className="stats-meter">
                        <motion.div
                          className="stats-meter-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${weekProgress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                    <ProgressRing
                      progress={weekProgress}
                      size={100}
                      label="semana"
                    />
                  </div>
                </InteractiveCard>
              </FloatingCard>
              
              {/* Mesocycle Status */}
              <FloatingCard delay={0.5}>
                <InteractiveCard
                  title="Mesociclo Actual"
                  icon={<Target className="h-5 w-5" />}
                  gradient="from-purple-500 to-indigo-600"
                  onClick={() => navigate(`/mesocycles/${activeMesocycle?.id}`)}
                >
                  {activeMesocycle ? (
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{activeMesocycle.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {activeMesocycle.length_weeks} semanas
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          {activeMesocycle.status === 'active' ? 'Activo' : activeMesocycle.status === 'completed' ? 'Completado' : 'Planificado'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">Sin mesociclo activo</p>
                      <Button
                        onClick={() => navigate('/mesocycles/create')}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Crear Mesociclo
                      </Button>
                    </div>
                  )}
                </InteractiveCard>
              </FloatingCard>
            </div>
          </FadeIn>
          
          {/* Quick Actions */}
          <FadeIn delay={0.6}>
            <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Dumbbell, label: 'Ejercicios', href: '/exercises', color: 'from-blue-500 to-cyan-500' },
                { icon: Activity, label: 'Progreso', href: '/progress', color: 'from-green-500 to-emerald-500' },
                { icon: Calendar, label: 'Workouts', href: '/workouts', color: 'from-purple-500 to-pink-500' },
                { icon: Award, label: 'Logros', href: '/achievements', color: 'from-amber-500 to-orange-500' },
              ].map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={action.href}>
                    <div className="glass-card p-6 text-center hover:shadow-lg transition-shadow">
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${action.color} mb-3`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="font-medium">{action.label}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
