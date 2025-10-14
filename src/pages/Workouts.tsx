import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Dumbbell, CheckCircle, Circle, XCircle, Plus, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useActiveMesocycle } from '@/hooks/useMesocycles';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Workouts() {
  const { data: activeMeso } = useActiveMesocycle();
  const { data: workouts = [] } = useWorkouts(activeMeso?.id);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'skipped':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'skipped':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredWorkouts = selectedDate
    ? workouts.filter(w => {
        const wDate = new Date(w.planned_date);
        return wDate.toDateString() === selectedDate.toDateString();
      })
    : workouts;

  // Función para personalizar los días del calendario
  const getDayContent = (day: Date) => {
    const dayWorkouts = workouts.filter(w => 
      isSameDay(new Date(w.planned_date), day)
    );
    
    if (dayWorkouts.length === 0) return undefined;

    const hasCompleted = dayWorkouts.some(w => w.status === 'completed');
    const hasPending = dayWorkouts.some(w => w.status === 'pending');
    const hasSkipped = dayWorkouts.some(w => w.status === 'skipped');

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {hasCompleted && <div className="h-1 w-1 rounded-full bg-success" />}
          {hasPending && <div className="h-1 w-1 rounded-full bg-primary" />}
          {hasSkipped && <div className="h-1 w-1 rounded-full bg-destructive" />}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Entrenamientos</h1>
          {activeMeso && (
            <Badge variant="outline">
              {activeMeso.name} - Semana {Math.ceil((Date.now() - activeMeso.start_date.getTime()) / (7 * 24 * 60 * 60 * 1000))}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                className="rounded-md border"
                modifiers={{
                  hasWorkout: (day) => workouts.some(w => 
                    isSameDay(new Date(w.planned_date), day)
                  )
                }}
                modifiersClassNames={{
                  hasWorkout: 'font-bold'
                }}
              />
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate 
                    ? `Entrenamientos - ${format(selectedDate, 'PPP', { locale: es })}`
                    : 'Todos los Entrenamientos'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredWorkouts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
                    <div className="rounded-full bg-muted p-6">
                      <Dumbbell className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        No hay entrenamientos programados
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {selectedDate 
                          ? `No tienes entrenamientos planificados para el ${format(selectedDate, 'PPP', { locale: es })}`
                          : 'No tienes entrenamientos planificados'}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button onClick={() => navigate('/programs/browse')} className="gap-2">
                        <Search className="h-4 w-4" />
                        Explorar Programas
                      </Button>
                      <Button onClick={() => navigate('/mesocycles/create')} variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Crear Mesociclo
                      </Button>
                    </div>
                  </div>
                ) : (
                  filteredWorkouts.map((workout) => (
                    <Card key={workout.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              {statusIcon(workout.status)}
                              <h3 className="font-semibold">
                                Día {workout.day_index + 1}
                              </h3>
                              <Badge variant={statusColor(workout.status) as any}>
                                {workout.status === 'completed' ? 'Completado' :
                                 workout.status === 'in_progress' ? 'En Progreso' :
                                 workout.status === 'skipped' ? 'Saltado' : 'Pendiente'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(workout.planned_date), 'PPP', { locale: es })}
                            </p>
                            {workout.duration_minutes && (
                              <p className="text-sm text-muted-foreground">
                                Duración: {workout.duration_minutes} min
                              </p>
                            )}
                            {workout.notes && (
                              <p className="text-sm mt-2">{workout.notes}</p>
                            )}
                          </div>
                          {workout.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => navigate('/workout/today')}
                            >
                              <Dumbbell className="h-4 w-4 mr-2" />
                              Empezar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
