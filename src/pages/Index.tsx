import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { runSeed } from '@/scripts/seedFirestore';
import { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { useActiveMesocycle } from '@/hooks/useMesocycles';
import { useTodayWorkout } from '@/hooks/useWorkouts';
import { useWeeklyVolume, useAdherence } from '@/hooks/useStats';
import { useStrengthProfile } from '@/hooks/useStrengthProfile';

const Index = () => {
  const { profile, role, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();
  const { data: activeMesocycle } = useActiveMesocycle();
  const { data: todayWorkout } = useTodayWorkout();
  const { data: weeklyVolume } = useWeeklyVolume();
  const { data: adherence } = useAdherence();
  const { hasCompletedCalibration, isLoading: isLoadingProfile } = useStrengthProfile();

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
        {/* Hero Header */}
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="stat-card border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Volumen
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyVolume || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">sets esta semana</p>
            </CardContent>
          </Card>

          <Card className="stat-card border-l-4 border-l-secondary">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Adherencia
                </CardTitle>
                <Target className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adherence || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">últimos 30 días</p>
            </CardContent>
          </Card>

          <Card className="stat-card border-l-4 border-l-success">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Progresión
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeMesocycle ? '+' + activeMesocycle.specialization.length * 2 : '0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">este ciclo</p>
            </CardContent>
          </Card>

          <Card className="stat-card border-l-4 border-l-warning">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ejercicios
                </CardTitle>
                <Dumbbell className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">en biblioteca</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Active Mesocycle */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-success opacity-10 rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-success" />
                <CardTitle>Mesociclo Actual</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {activeMesocycle ? (
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
                      <Badge className="bg-success/10 text-success border-success/20">
                        {activeMesocycle.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[45%] bg-gradient-primary rounded-full" />
                    </div>
                  </div>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
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
