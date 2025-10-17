import { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Dumbbell, Flame, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MUSCLE_GRADIENTS } from '@/lib/exerciseAssets';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/layout/PageTransition';

interface Workout {
  id: string;
  planned_date: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  day_index: number;
  duration_minutes: number | null;
  exercises?: Array<{
    name: string;
    prime_muscle: string;
    sets_count: number;
  }>;
}

interface WeeklyCalendarViewProps {
  workouts: Workout[];
  onDayClick?: (day: Date, workouts: Workout[]) => void;
  currentWeekStart?: Date;
}

/**
 * Vista de calendario semanal mejorada
 * Muestra entrenamientos organizados por día con estadísticas visuales
 */
export function WeeklyCalendarView({ 
  workouts, 
  onDayClick,
  currentWeekStart = startOfWeek(new Date(), { locale: es })
}: WeeklyCalendarViewProps) {
  
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const workoutsByDay = useMemo(() => {
    return weekDays.map(day => ({
      date: day,
      workouts: workouts.filter(w => isSameDay(new Date(w.planned_date), day)),
    }));
  }, [weekDays, workouts]);

  // Estadísticas semanales
  const weekStats = useMemo(() => {
    const thisWeekWorkouts = workouts.filter(w => {
      const wDate = new Date(w.planned_date);
      return wDate >= weekDays[0] && wDate <= weekDays[6];
    });

    return {
      total: thisWeekWorkouts.length,
      completed: thisWeekWorkouts.filter(w => w.status === 'completed').length,
      totalMinutes: thisWeekWorkouts
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
    };
  }, [workouts, weekDays]);

  return (
    <div className="space-y-6">
      {/* Weekly Stats Header */}
      <FadeIn>
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <div className="text-2xl font-bold">
                    {weekStats.completed}/{weekStats.total}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Completados</div>
              </div>
              
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div className="text-2xl font-bold">
                    {Math.round(weekStats.totalMinutes / 60)}h
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Entrenadas</div>
              </div>
              
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Flame className="h-4 w-4 text-red-500" />
                  <div className="text-2xl font-bold">
                    {weekStats.completed > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Adherencia</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Calendar Grid */}
      <StaggerChildren staggerDelay={0.05}>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {workoutsByDay.map(({ date, workouts: dayWorkouts }) => (
            <StaggerItem key={date.toISOString()}>
              <DayCard
                date={date}
                workouts={dayWorkouts}
                onClick={() => onDayClick?.(date, dayWorkouts)}
              />
            </StaggerItem>
          ))}
        </div>
      </StaggerChildren>
    </div>
  );
}

/**
 * Card individual de día con entrenamientos
 */
interface DayCardProps {
  date: Date;
  workouts: Workout[];
  onClick?: () => void;
}

function DayCard({ date, workouts, onClick }: DayCardProps) {
  const isCurrentDay = isToday(date);
  const hasWorkouts = workouts.length > 0;
  const isCompleted = workouts.every(w => w.status === 'completed');
  const hasPending = workouts.some(w => w.status === 'pending');
  
  // Obtener músculos únicos entrenados
  const musclesWorked = useMemo(() => {
    const muscles = new Set<string>();
    workouts.forEach(workout => {
      workout.exercises?.forEach(ex => muscles.add(ex.prime_muscle));
    });
    return Array.from(muscles);
  }, [workouts]);

  const totalSets = useMemo(() => {
    return workouts.reduce((sum, w) => {
      return sum + (w.exercises?.reduce((s, e) => s + e.sets_count, 0) || 0);
    }, 0);
  }, [workouts]);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative overflow-hidden transition-all cursor-pointer group",
        isCurrentDay && "ring-2 ring-primary shadow-lg shadow-primary/20",
        hasWorkouts && "hover:shadow-lg hover:-translate-y-1",
        !hasWorkouts && "opacity-60"
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {format(date, 'EEE', { locale: es })}
            </div>
            <div className={cn(
              "text-2xl font-bold",
              isCurrentDay && "text-primary"
            )}>
              {format(date, 'd')}
            </div>
          </div>

          {/* Status Icon */}
          {hasWorkouts && (
            <div>
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : hasPending ? (
                <Circle className="h-5 w-5 text-primary animate-pulse" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* Workouts Info */}
        {hasWorkouts ? (
          <div className="space-y-2">
            {/* Workout Count */}
            <div className="flex items-center gap-2 text-sm">
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">
                {workouts.length} {workouts.length === 1 ? 'entreno' : 'entrenos'}
              </span>
            </div>

            {/* Muscle Groups */}
            {musclesWorked.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {musclesWorked.slice(0, 3).map(muscle => {
                  const gradient = MUSCLE_GRADIENTS[muscle] || 'from-gray-500 to-slate-500';
                  return (
                    <div
                      key={muscle}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium text-white",
                        `bg-gradient-to-r ${gradient}`
                      )}
                    >
                      {muscle}
                    </div>
                  );
                })}
                {musclesWorked.length > 3 && (
                  <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted">
                    +{musclesWorked.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Total Sets */}
            {totalSets > 0 && (
              <div className="text-xs text-muted-foreground">
                {totalSets} series totales
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-2">
            Día de descanso
          </div>
        )}

        {/* Today Indicator */}
        {isCurrentDay && (
          <div className="absolute top-2 left-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}

        {/* Hover Gradient */}
        {hasWorkouts && (
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        )}
      </CardContent>
    </Card>
  );
}
