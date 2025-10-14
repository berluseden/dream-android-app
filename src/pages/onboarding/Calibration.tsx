import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStrengthProfile } from '@/hooks/useStrengthProfile';
import { MovementPattern } from '@/types/strength.types';
import { ChevronRight, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CALIBRATION_EXERCISES = [
  { pattern: 'squat' as MovementPattern, name: 'Sentadilla', description: 'Back Squat o Front Squat' },
  { pattern: 'bench' as MovementPattern, name: 'Press de Banca', description: 'Barbell Bench Press' },
  { pattern: 'row' as MovementPattern, name: 'Remo', description: 'Barbell Row o Chest-Supported Row' },
  { pattern: 'overhead_press' as MovementPattern, name: 'Press de Hombro', description: 'Overhead Press o Military Press' },
];

export default function Calibration() {
  const navigate = useNavigate();
  const { saveCalibration } = useStrengthProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [calibrations, setCalibrations] = useState<{
    [key in MovementPattern]?: { load: number; reps: number; rir: number };
  }>({});

  const [formData, setFormData] = useState({ load: 0, reps: 8, rir: 1 });

  const currentExercise = CALIBRATION_EXERCISES[currentStep];
  const progress = ((currentStep + 1) / CALIBRATION_EXERCISES.length) * 100;

  const handleNext = async () => {
    if (formData.load <= 0 || formData.reps <= 0) return;

    // Save current calibration
    await saveCalibration.mutateAsync({
      pattern: currentExercise.pattern,
      load: formData.load,
      reps: formData.reps,
      rir: formData.rir,
    });

    setCalibrations(prev => ({
      ...prev,
      [currentExercise.pattern]: formData,
    }));

    if (currentStep < CALIBRATION_EXERCISES.length - 1) {
      setCurrentStep(prev => prev + 1);
      setFormData({ load: 0, reps: 8, rir: 1 });
    } else {
      // Completed all calibrations
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
              disabled={formData.load <= 0 || formData.reps <= 0 || saveCalibration.isPending}
              className="flex-1"
            >
              {currentStep === CALIBRATION_EXERCISES.length - 1 ? 'Finalizar' : 'Siguiente'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
