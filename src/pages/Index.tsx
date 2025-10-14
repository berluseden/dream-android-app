import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { runSeed } from '@/scripts/seedFirestore';
import { useState } from 'react';
import { Loader2, Dumbbell, Calendar, TrendingUp, Target, Plus, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { useActiveMesocycle } from '@/hooks/useMesocycles';
import { useTodayWorkout } from '@/hooks/useWorkouts';
import { useWeeklyVolume, useAdherence } from '@/hooks/useStats';

const Index = () => {
  const { profile, role, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();
  const { data: activeMesocycle } = useActiveMesocycle();
  const { data: todayWorkout } = useTodayWorkout();
  const { data: weeklyVolume } = useWeeklyVolume();
  const { data: adherence } = useAdherence();

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
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido, {profile?.name}</p>
          <Badge className="mt-2">{role}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volumen Semanal</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyVolume || 0} sets</div>
              <p className="text-xs text-muted-foreground">Últimos 7 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ejercicios</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">En biblioteca</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresión</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeMesocycle ? '+' + activeMesocycle.specialization.length * 2 : '0'}%
              </div>
              <p className="text-xs text-muted-foreground">Este mesociclo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adherencia</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adherence || 0}%</div>
              <p className="text-xs text-muted-foreground">Últimas 4 semanas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mesociclo Actual</CardTitle>
            </CardHeader>
            <CardContent>
              {activeMesocycle ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{activeMesocycle.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeMesocycle.length_weeks} semanas • {activeMesocycle.effort_scale}
                  </p>
                  <Badge>{activeMesocycle.status}</Badge>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No tienes un mesociclo activo</p>
                  <Button onClick={() => navigate('/mesocycles/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Mesociclo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entrenamiento de Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              {todayWorkout ? (
                <div className="space-y-4">
                  <div>
                    <Badge className="mb-2">{todayWorkout.status}</Badge>
                    <p className="text-sm text-muted-foreground">Día {todayWorkout.day_index}</p>
                  </div>
                  <Button onClick={() => navigate('/workout/today')} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Ir al Entrenamiento
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay entrenamiento programado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Herramientas de Administrador</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSeed} 
                disabled={seeding}
                variant="outline"
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
