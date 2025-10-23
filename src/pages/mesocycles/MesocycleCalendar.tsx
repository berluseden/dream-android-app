import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ArrowLeft, Dumbbell, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Workout {
  id: string;
  name: string;
  scheduled_date: Date;
  week_number: number;
  day_number: number;
  status: string;
}

interface Mesocycle {
  id: string;
  name: string;
  start_date: Date;
  length_weeks: number;
  template_id?: string;
  status: string;
}

export default function MesocycleCalendar() {
  const { mesocycleId } = useParams<{ mesocycleId: string }>();
  const navigate = useNavigate();

  // Obtener mesociclo
  const { data: mesocycle, isLoading: loadingMeso } = useQuery<Mesocycle | null>({
    queryKey: ['mesocycle', mesocycleId],
    queryFn: async () => {
      if (!mesocycleId) return null;
      const mesoRef = doc(db, 'mesocycles', mesocycleId);
      const mesoSnap = await getDoc(mesoRef);
      if (!mesoSnap.exists()) return null;
      const data = mesoSnap.data();
      return {
        id: mesoSnap.id,
        ...data,
        start_date: data.start_date?.toDate(),
      } as Mesocycle;
    },
    enabled: !!mesocycleId,
  });

  // Obtener workouts del mesociclo
  const { data: workouts, isLoading: loadingWorkouts } = useQuery<Workout[]>({
    queryKey: ['mesocycle-workouts', mesocycleId],
    queryFn: async () => {
      if (!mesocycleId) return [];
      const workoutsRef = collection(db, 'workouts');
      const q = query(
        workoutsRef,
        where('mesocycle_id', '==', mesocycleId),
        orderBy('scheduled_date', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduled_date: doc.data().scheduled_date?.toDate(),
      })) as Workout[];
    },
    enabled: !!mesocycleId,
  });

  if (loadingMeso || loadingWorkouts) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!mesocycle) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Mesociclo no encontrado</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Agrupar workouts por semana
  const workoutsByWeek: Record<number, Workout[]> = {};
  workouts?.forEach(workout => {
    if (!workoutsByWeek[workout.week_number]) {
      workoutsByWeek[workout.week_number] = [];
    }
    workoutsByWeek[workout.week_number].push(workout);
  });

  const totalWeeks = mesocycle.length_weeks;
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              {mesocycle.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Calendario de entrenamiento • {totalWeeks} semanas
            </p>
          </div>
          <Badge variant={mesocycle.status === 'active' ? 'default' : 'secondary'}>
            {mesocycle.status === 'active' ? 'Activo' : mesocycle.status}
          </Badge>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Entrenamientos</p>
                  <p className="text-2xl font-bold">{workouts?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completados</p>
                  <p className="text-2xl font-bold">
                    {workouts?.filter(w => w.status === 'completed').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">
                    {workouts?.filter(w => w.status === 'scheduled').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendario por semanas */}
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Entrenamientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {weeks.map(weekNum => {
              const weekWorkouts = workoutsByWeek[weekNum] || [];
              const weekStart = addDays(mesocycle.start_date, (weekNum - 1) * 7);

              return (
                <div key={weekNum} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Semana {weekNum}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: es })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const date = addDays(weekStart, dayIndex);
                      const dayWorkout = weekWorkouts.find(w => 
                        isSameDay(w.scheduled_date, date)
                      );

                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            "p-3 rounded-lg border transition-all",
                            dayWorkout 
                              ? "bg-primary/5 border-primary/30 cursor-pointer hover:bg-primary/10" 
                              : "bg-muted/30 border-muted"
                          )}
                          onClick={() => {
                            if (dayWorkout) {
                              navigate(`/workout/${dayWorkout.id}`);
                            }
                          }}
                        >
                          <div className="text-xs text-muted-foreground mb-1">
                            {format(date, 'EEE', { locale: es })}
                          </div>
                          <div className="text-sm font-medium mb-2">
                            {format(date, 'd', { locale: es })}
                          </div>
                          {dayWorkout ? (
                            <div className="space-y-1">
                              <p className="text-xs font-medium truncate">
                                {dayWorkout.name}
                              </p>
                              <Badge 
                                variant={dayWorkout.status === 'completed' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {dayWorkout.status === 'completed' ? '✓' : '○'}
                              </Badge>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Descanso</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex gap-3">
          <Button onClick={() => navigate('/')} variant="outline">
            Ir al Dashboard
          </Button>
          {workouts && workouts.length > 0 && (
            <Button onClick={() => {
              const nextWorkout = workouts.find(w => w.status === 'scheduled');
              if (nextWorkout) {
                navigate(`/workout/${nextWorkout.id}`);
              }
            }}>
              Comenzar Siguiente Entrenamiento
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
