import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Dumbbell, CheckCircle, Circle, XCircle, Plus, Search, CalendarDays } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useActiveMesocycle } from '@/hooks/useMesocycles';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { WeeklyCalendarView } from '@/components/workouts/WeeklyCalendarView';
import { FadeIn } from '@/components/layout/PageTransition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Workouts() {
  const { data: activeMeso } = useActiveMesocycle();
  const { data: workouts = [] } = useWorkouts(activeMeso?.id);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
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

  const statusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado ✓';
      case 'in_progress':
        return 'En Progreso ⏳';
      case 'skipped':
        return 'Saltado ✗';
      default:
        return 'Pendiente';
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
        <FadeIn>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Mis Entrenamientos
              </h1>
              {activeMeso && (
                <p className="text-muted-foreground">
                  {activeMeso.name} - Semana {Math.ceil((Date.now() - activeMeso.start_date.getTime()) / (7 * 24 * 60 * 60 * 1000))}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => navigate('/mesocycles/create')} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Mesociclo
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Tabs para cambiar vista */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="week" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Vista Semanal
            </TabsTrigger>
            <TabsTrigger value="month" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Vista Mensual
            </TabsTrigger>
          </TabsList>

          {/* Weekly View */}
          <TabsContent value="week" className="space-y-6 mt-6">
            <WeeklyCalendarView
              workouts={workouts}
              currentWeekStart={startOfWeek(selectedDate || new Date(), { locale: es })}
              onDayClick={(day, dayWorkouts) => {
                setSelectedDate(day);
                if (dayWorkouts.length > 0) {
                  // Navigate to first workout of the day
                  navigate(`/workout/${dayWorkouts[0].id}`);
                }
              }}
            />
          </TabsContent>

          {/* Monthly View */}
          <TabsContent value="month" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 glass-card">
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
                      hasWorkout: 'font-bold text-primary'
                    }}
                  />
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                <Card className="glass-card">
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
                        <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-6">
                          <Dumbbell className="h-12 w-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">
                            No hay entrenamientos programados
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            {selectedDate 
                              ? `No tienes entrenamientos para el ${format(selectedDate, 'PPP', { locale: es })}`
                              : 'Crea un nuevo mesociclo para empezar'}
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
                      filteredWorkouts.map((workout, idx) => (
                        <Card 
                          key={workout.id}
                          className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                          style={{ animationDelay: `${idx * 50}ms` }}
                          onClick={() => navigate(`/workout/${workout.id}`)}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  {statusIcon(workout.status)}
                                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                                    Día {workout.day_index + 1}
                                  </h3>
                                  <Badge variant={statusColor(workout.status) as any}>
                                    {statusText(workout.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(workout.planned_date), 'PPP', { locale: es })}
                                </p>
                                {workout.duration_minutes && (
                                  <p className="text-sm text-muted-foreground">
                                    ⏱️ {workout.duration_minutes} minutos
                                  </p>
                                )}
                                {workout.notes && (
                                  <p className="text-sm mt-2 text-muted-foreground">{workout.notes}</p>
                                )}
                              </div>
                              {workout.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/workout/today');
                                  }}
                                  className="group-hover:scale-105 transition-transform"
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
