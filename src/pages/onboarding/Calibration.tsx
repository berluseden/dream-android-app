import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStrengthProfile } from '@/hooks/useStrengthProfile';
import { useActiveMesocycle } from '@/hooks/useMesocycles';
import { MovementPattern } from '@/types/strength.types';
import { ChevronRight, CheckCircle2, Info, Plus, Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const CALIBRATION_EXERCISES = [
  { pattern: 'squat' as MovementPattern, name: 'Sentadilla', description: 'Back Squat o Front Squat' },
  { pattern: 'bench' as MovementPattern, name: 'Press de Banca', description: 'Barbell Bench Press' },
  { pattern: 'row' as MovementPattern, name: 'Remo', description: 'Barbell Row o Chest-Supported Row' },
  { pattern: 'overhead_press' as MovementPattern, name: 'Press de Hombro', description: 'Overhead Press o Military Press' },
];

export default function Calibration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveCalibration, profiles } = useStrengthProfile();
  const { data: activeMesocycle } = useActiveMesocycle();
  const [currentStep, setCurrentStep] = useState(0);
  const [calibrations, setCalibrations] = useState<{
    [key in MovementPattern]?: Array<{ load: number; reps: number; rir: number }>;
  }>({});

  const [formData, setFormData] = useState({ load: 0, reps: 8, rir: 1 });
  const [setsForCurrentExercise, setSetsForCurrentExercise] = useState<
    Array<{ load: number; reps: number; rir: number }>
  >([]);

  // NEW: Import previous weights from last mesocycle
  const handleImportPreviousWeights = async () => {
    if (!activeMesocycle) {
      toast({
        title: 'Sin mesociclo activo',
        description: 'No hay pesos previos para importar',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get last workout from previous mesocycle
      const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const workoutsRef = collection(db, 'workouts');
      const lastWorkoutQuery = query(
        workoutsRef,
        where('mesocycle_id', '==', activeMesocycle.id),
        where('status', '==', 'completed'),
        orderBy('completed_at', 'desc'),
        limit(1)
      );
      
      const workoutSnapshot = await getDocs(lastWorkoutQuery);
      
      if (workoutSnapshot.empty) {
        toast({
          title: 'No hay entrenamientos previos',
          description: 'Completa tu primer entrenamiento para importar cargas',
        });
        return;
      }
      
      const lastWorkout = workoutSnapshot.docs[0];
      
      // Get sets from last workout for current exercise pattern
      const setsRef = collection(db, 'sets');
      const setsQuery = query(
        setsRef,
        where('workout_id', '==', lastWorkout.id),
        where('set_type', '==', 'working'), // Only working sets
        orderBy('load', 'desc'),
        limit(1)
      );
      
      const setsSnapshot = await getDocs(setsQuery);
      
      if (setsSnapshot.empty) {
        toast({
          title: 'No hay sets previos',
          description: 'No se encontraron cargas para este patrón',
        });
        return;
      }
      
      // Import the heaviest set as reference
      const lastSet = setsSnapshot.docs[0].data();
      setFormData({
        load: lastSet.load || 0,
        reps: lastSet.completed_reps || 8,
        rir: lastSet.rir_actual || 1,
      });
      
      toast({
        title: 'Cargas importadas',
        description: `Última carga: ${lastSet.load}kg × ${lastSet.completed_reps} reps`,
      });
    } catch (error) {
      console.error('Error importing previous weights:', error);
      toast({
        title: 'Error al importar',
        description: 'No se pudieron cargar los pesos anteriores',
        variant: 'destructive',
      });
    }
  };

  const currentExercise = CALIBRATION_EXERCISES[currentStep];
  const progress = ((currentStep + 1) / CALIBRATION_EXERCISES.length) * 100;

  // NEW: Handle adding multiple sets
  const handleAddSet = () => {
    if (formData.load <= 0 || formData.reps <= 0) return;

    setSetsForCurrentExercise(prev => [...prev, formData]);
    setFormData({ load: 0, reps: 8, rir: 1 });
    
    toast({
      title: 'Set agregado',
      description: `${formData.load}kg × ${formData.reps} reps @RIR ${formData.rir}`,
    });
  };

  const handleNext = async () => {
    // Must have at least 1 set
    if (setsForCurrentExercise.length === 0 && (formData.load <= 0 || formData.reps <= 0)) {
      toast({
        title: 'Error',
        description: 'Debes registrar al menos un set',
        variant: 'destructive',
      });
      return;
    }

    // Add current formData if not empty
    const allSets = formData.load > 0 
      ? [...setsForCurrentExercise, formData]
      : setsForCurrentExercise;

    // Calculate average e1RM from all sets
    const avgLoad = allSets.reduce((sum, s) => sum + s.load, 0) / allSets.length;
    const avgReps = Math.round(allSets.reduce((sum, s) => sum + s.reps, 0) / allSets.length);
    const avgRir = Math.round(allSets.reduce((sum, s) => sum + s.rir, 0) / allSets.length);

    // Save calibration with average values
    await saveCalibration.mutateAsync({
      pattern: currentExercise.pattern,
      load: avgLoad,
      reps: avgReps,
      rir: avgRir,
    });

    setCalibrations(prev => ({
      ...prev,
      [currentExercise.pattern]: allSets,
    }));

    if (currentStep < CALIBRATION_EXERCISES.length - 1) {
      setCurrentStep(prev => prev + 1);
      setFormData({ load: 0, reps: 8, rir: 1 });
      setSetsForCurrentExercise([]);
    } else {
      // Completed all calibrations
      toast({
        title: '¡Calibración completada!',
        description: 'Tus cargas iniciales han sido calculadas',
      });
      navigate('/');
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Calibración de Fuerza</h1>
            <p className="text-muted-foreground">
              Registra un set representativo de cada patrón para calcular tus cargas iniciales
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Ejercicio {currentStep + 1} de {CALIBRATION_EXERCISES.length}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Registra un <strong>top set</strong> (cerca del fallo, RIR ≈ 1-2) que hayas hecho recientemente.
              Esto nos ayuda a estimar tus cargas de trabajo para cada ejercicio.
            </AlertDescription>
          </Alert>

          {/* NEW: Import Previous Weights Button */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">¿Ya has entrenado antes?</p>
                  <p className="text-sm text-muted-foreground">
                    Importa tus últimas cargas para ahorrar tiempo
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleImportPreviousWeights}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Importar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calibration Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{currentExercise.name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {currentExercise.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {currentStep + 1}/{CALIBRATION_EXERCISES.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Load Input */}
              <div className="space-y-2">
                <Label htmlFor="load" className="text-base">Carga Utilizada (kg)</Label>
                <Input
                  id="load"
                  type="number"
                  step="2.5"
                  value={formData.load || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, load: parseFloat(e.target.value) || 0 }))}
                  placeholder="ej: 80"
                  className="text-2xl h-14 text-center font-bold"
                />
              </div>

              {/* Reps Input */}
              <div className="space-y-2">
                <Label htmlFor="reps" className="text-base">Repeticiones Completadas</Label>
                <Input
                  id="reps"
                  type="number"
                  value={formData.reps || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, reps: parseInt(e.target.value) || 0 }))}
                  placeholder="ej: 8"
                  className="text-2xl h-14 text-center font-bold"
                />
              </div>

              {/* RIR Selection */}
              <div className="space-y-2">
                <Label className="text-base">RIR (Reps en Reserva)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 1, 2, 3, 4].map((rir) => (
                    <Button
                      key={rir}
                      type="button"
                      variant={formData.rir === rir ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, rir }))}
                      className="h-14 text-lg font-bold"
                    >
                      {rir}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  0 = Fallo · 1 = Quedaba 1 rep · 2 = Quedaban 2 reps
                </p>
              </div>

              {/* NEW: Multiple Sets Section */}
              {setsForCurrentExercise.length > 0 && (
                <div className="pt-4 border-t space-y-2">
                  <Label className="text-sm font-medium">Sets registrados ({setsForCurrentExercise.length}):</Label>
                  <div className="space-y-1">
                    {setsForCurrentExercise.map((set, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-muted rounded text-sm"
                      >
                        <Badge variant="outline">{idx + 1}</Badge>
                        <span className="font-medium">{set.load}kg × {set.reps} reps</span>
                        <span className="text-muted-foreground">@RIR {set.rir}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW: Add Set Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSet}
                disabled={formData.load <= 0 || formData.reps <= 0}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar otro set (opcional)
              </Button>

              {/* Completed Exercises */}
              {Object.keys(calibrations).length > 0 && (
                <div className="pt-4 border-t space-y-2">
                  <Label className="text-sm text-muted-foreground">Ya calibrados:</Label>
                  <div className="flex flex-wrap gap-2">
                    {CALIBRATION_EXERCISES.slice(0, currentStep).map((ex) => (
                      <Badge key={ex.pattern} variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {ex.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Saltar por ahora
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                (setsForCurrentExercise.length === 0 && (formData.load <= 0 || formData.reps <= 0)) || 
                saveCalibration.isPending
              }
              className="flex-1"
            >
              {saveCalibration.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {currentStep === CALIBRATION_EXERCISES.length - 1 ? 'Finalizar' : 'Siguiente'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
