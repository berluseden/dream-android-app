import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMesocycle, useUpdateMesocycleStatus, useDeleteMesocycle } from '@/hooks/useMesocycles';
import { useWorkoutsWithExercises } from '@/hooks/useWorkouts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Target, Dumbbell, ArrowLeft, TrendingUp, MoreVertical, Pause, CheckCircle2, Trash2, Play } from 'lucide-react';
import { format, differenceInDays, addWeeks, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { WeeklyCalendarView } from '@/components/workouts/WeeklyCalendarView';
import { useState } from 'react';

export default function MesocycleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: mesocycle, isLoading } = useMesocycle(id);
  const { data: workouts = [], isLoading: workoutsLoading } = useWorkoutsWithExercises(id);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = semana actual
  
  // Estado para diálogos
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Hooks de mutations
  const updateStatus = useUpdateMesocycleStatus();
  const deleteMesocycle = useDeleteMesocycle();
  
  // Handlers
  const handlePause = () => {
    updateStatus.mutate({ 
      mesocycleId: id!, 
      status: 'paused' 
    });
    setShowPauseDialog(false);
  };

  const handleComplete = () => {
    updateStatus.mutate({ 
      mesocycleId: id!, 
      status: 'completed' 
    });
    setShowCompleteDialog(false);
  };

  const handleResume = () => {
    updateStatus.mutate({ 
      mesocycleId: id!, 
      status: 'active' 
    });
  };

  const handleDelete = () => {
    deleteMesocycle.mutate(id!, {
      onSuccess: () => {
        navigate('/');
      }
    });
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Cargando mesociclo...</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  if (!mesocycle) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <h2 className="text-xl font-semibold">Mesociclo no encontrado</h2>
              <p className="text-muted-foreground">
                El mesociclo que buscas no existe o no tienes acceso a él.
              </p>
              <Button onClick={() => navigate('/')}>
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  // Calcular progreso
  const today = new Date();
  const startDate = mesocycle.start_date;
  const endDate = addWeeks(startDate, mesocycle.length_weeks);
  const totalDays = differenceInDays(endDate, startDate);
  const daysElapsed = Math.max(0, differenceInDays(today, startDate));
  const progressPercent = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  const currentWeek = Math.max(1, Math.ceil(daysElapsed / 7));
  
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{mesocycle.name}</h1>
            <p className="text-muted-foreground">
              {format(startDate, "d 'de' MMMM, yyyy", { locale: es })} - {format(endDate, "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <Badge variant={
            mesocycle.status === 'active' ? 'default' :
            mesocycle.status === 'completed' ? 'secondary' : 'outline'
          }>
            {mesocycle.status === 'active' ? 'Activo' :
             mesocycle.status === 'completed' ? 'Completado' : 
             mesocycle.status === 'paused' ? 'Pausado' : 'Planificado'}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {mesocycle.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => setShowPauseDialog(true)}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar Mesociclo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCompleteDialog(true)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como Completado
                  </DropdownMenuItem>
                </>
              )}
              
              {mesocycle.status === 'paused' && (
                <DropdownMenuItem onClick={() => handleResume()}>
                  <Play className="mr-2 h-4 w-4" />
                  Reanudar Mesociclo
                </DropdownMenuItem>
              )}
              
              {mesocycle.status !== 'active' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Mesociclo
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progreso General
            </CardTitle>
            <CardDescription>
              Semana {currentWeek} de {mesocycle.length_weeks}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{Math.round(progressPercent)}% Completado</span>
                <span className="text-muted-foreground">{daysElapsed} de {totalDays} días</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
          </CardContent>
        </Card>
        
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Duración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{mesocycle.length_weeks} semanas</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalDays} días de entrenamiento
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Especialización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{mesocycle.specialization.length} músculos</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {mesocycle.specialization.slice(0, 3).map((muscleId) => (
                  <Badge key={muscleId} variant="secondary" className="text-xs">
                    {muscleId}
                  </Badge>
                ))}
                {mesocycle.specialization.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{mesocycle.specialization.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Escala de Esfuerzo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{mesocycle.effort_scale}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {mesocycle.effort_scale === 'RIR' ? 'Reps en Reserva' : 'Percepción de Esfuerzo'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Calendario de Entrenamientos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Calendario de Entrenamientos</CardTitle>
                <CardDescription>
                  Vista detallada de tu programa semanal
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
                  disabled={selectedWeek === 0}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedWeek(Math.min(mesocycle.length_weeks - 1, selectedWeek + 1))}
                  disabled={selectedWeek >= mesocycle.length_weeks - 1}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {workoutsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando entrenamientos...
              </div>
            ) : workouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay entrenamientos programados para este mesociclo
              </div>
            ) : (
              <WeeklyCalendarView 
                workouts={workouts}
                currentWeekStart={addWeeks(startOfWeek(startDate, { locale: es }), selectedWeek)}
                onDayClick={(date, dayWorkouts) => {
                  if (dayWorkouts.length > 0) {
                    navigate(`/workout/${dayWorkouts[0].id}`);
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={() => navigate('/')} className="flex-1">
            Ver Entrenamiento de Hoy
          </Button>
          <Button variant="outline" onClick={() => navigate('/progress')}>
            Ver Progreso
          </Button>
        </div>
        
        {/* Diálogo de Pausa */}
        <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Pausar este mesociclo?</AlertDialogTitle>
              <AlertDialogDescription>
                Podrás reanudar el mesociclo más adelante. Tus entrenamientos se mantendrán guardados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handlePause}>
                Pausar Mesociclo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo de Completar */}
        <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Marcar como completado?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto marcará el mesociclo como finalizado. Podrás ver tus estadísticas y progreso en cualquier momento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleComplete}>
                Completar Mesociclo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo de Eliminar */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este mesociclo?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p className="font-semibold text-destructive">
                  ⚠️ Esta acción no se puede deshacer
                </p>
                <p>
                  Se eliminarán todos los entrenamientos, ejercicios y datos de progreso asociados a este mesociclo.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
