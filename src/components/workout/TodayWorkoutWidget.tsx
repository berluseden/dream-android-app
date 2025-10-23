import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Dumbbell, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodayWorkoutDetails, useTodayWorkoutStats } from '@/hooks/useWorkoutDetails';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Widget destacado que muestra el workout del día actual
 * Inspirado en las apps exitosas: Hevy, Strong, RP
 */
export function TodayWorkoutWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: todayWorkout, isLoading } = useTodayWorkoutDetails(user?.uid || '');
  const stats = useTodayWorkoutStats(user?.uid || '');

  if (isLoading) {
    return <TodayWorkoutSkeleton />;
  }

  if (!todayWorkout) {
    return <NoWorkoutToday />;
  }

  const handleStartWorkout = () => {
    navigate(`/workout/${todayWorkout.workout.id}`);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              Entrenamiento de Hoy
            </CardTitle>
            <CardDescription className="mt-1">
              {format(todayWorkout.workout.planned_date, "EEEE, d 'de' MMMM", { locale: es })}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            Semana {todayWorkout.weekNumber}/{todayWorkout.totalWeeks}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Nombre del workout y mesociclo */}
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {todayWorkout.workout.session_name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Target className="h-3 w-3" />
            {todayWorkout.mesocycle.name}
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card/50 rounded-lg p-3 text-center border">
            <div className="text-2xl font-bold text-primary">
              {stats.totalExercises}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Ejercicios
            </div>
          </div>
          
          <div className="bg-card/50 rounded-lg p-3 text-center border">
            <div className="text-2xl font-bold text-primary">
              {stats.totalSets}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Series
            </div>
          </div>
          
          <div className="bg-card/50 rounded-lg p-3 text-center border">
            <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
              <Clock className="h-4 w-4" />
              {stats.estimatedDuration}'
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Duración
            </div>
          </div>
        </div>

        {/* Lista de ejercicios (preview primeros 3) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              Ejercicios del día
            </h4>
            {todayWorkout.exercises.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{todayWorkout.exercises.length - 3} más
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            {todayWorkout.exercises.slice(0, 3).map((exercise, index) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between p-2 rounded-md bg-card/30 border text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5">
                    {index + 1}.
                  </span>
                  <span className="font-medium">{exercise.exercise_name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {exercise.sets_target}x{exercise.rep_range_min}-{exercise.rep_range_max} @ RIR {exercise.rir_target}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs Principales */}
        <div className="flex gap-2">
          <Button 
            onClick={handleStartWorkout}
            size="lg"
            className="flex-1 text-lg font-semibold"
          >
            <Dumbbell className="mr-2 h-5 w-5" />
            Comenzar
          </Button>
          <Button 
            onClick={() => navigate(`/mesocycles/${todayWorkout.mesocycle.id}/calendar`)}
            size="lg"
            variant="outline"
            className="flex-1"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Ver Calendario
          </Button>
        </div>

        {/* Progreso del mesociclo */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progreso del mesociclo</span>
            <span className="font-medium">
              Día {todayWorkout.dayNumber} de {todayWorkout.totalDays}
            </span>
          </div>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ 
                width: `${(todayWorkout.dayNumber / todayWorkout.totalDays) * 100}%` 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Estado cuando no hay workout programado para hoy
 */
function NoWorkoutToday() {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="rounded-full bg-muted p-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Día de descanso</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No tienes entrenamientos programados para hoy
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/calendar')}
          >
            Ver Calendario
          </Button>
          <Button onClick={() => navigate('/programs')}>
            Crear Mesociclo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton mientras carga
 */
function TodayWorkoutSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}
