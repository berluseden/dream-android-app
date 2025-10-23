import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMesocycle } from '@/hooks/useMesocycles';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, Dumbbell, ArrowLeft, Clock, TrendingUp } from 'lucide-react';
import { format, differenceInDays, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MesocycleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: mesocycle, isLoading } = useMesocycle(id);
  
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
            <CardTitle>Calendario de Entrenamientos</CardTitle>
            <CardDescription>
              Vista detallada de tu programa semanal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Vista de calendario próximamente...</p>
              <p className="text-sm mt-2">
                Aquí podrás ver todos tus entrenamientos programados
              </p>
            </div>
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
      </div>
    </AppLayout>
  );
}
