import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMuscles } from '@/hooks/useExercises';
import { useCreateMesocycle } from '@/hooks/useMesocycles';
import { useAuth } from '@/hooks/useAuth';
import { CalendarIcon, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CreateMesocycle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: muscles } = useMuscles();
  const createMesocycle = useCreateMesocycle();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [lengthWeeks, setLengthWeeks] = useState(6);
  const [effortScale, setEffortScale] = useState<'RIR' | 'RPE'>('RIR');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [volumeTargets, setVolumeTargets] = useState<Record<string, { min: number; max: number; target: number }>>({});

  const toggleMuscle = (muscleId: string) => {
    setSelectedMuscles(prev => 
      prev.includes(muscleId) 
        ? prev.filter(id => id !== muscleId)
        : [...prev, muscleId]
    );
  };

  const setVolumeForMuscle = (muscleId: string, value: number) => {
    setVolumeTargets(prev => ({
      ...prev,
      [muscleId]: {
        min: Math.max(0, value - 2),
        max: value + 2,
        target: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!user || !startDate) return;

    const targets = selectedMuscles.map(muscleId => ({
      muscle_id: muscleId,
      sets_min: volumeTargets[muscleId].min,
      sets_max: volumeTargets[muscleId].max,
      sets_target: volumeTargets[muscleId].target,
    }));

    await createMesocycle.mutateAsync({
      user_id: user.uid,
      name,
      start_date: startDate,
      length_weeks: lengthWeeks,
      specialization: selectedMuscles,
      effort_scale: effortScale,
      targets,
    });

    navigate('/');
  };

  const canContinueStep1 = name && startDate && lengthWeeks >= 4 && lengthWeeks <= 8;
  const canContinueStep2 = selectedMuscles.length > 0;
  const canSubmit = selectedMuscles.every(id => volumeTargets[id]);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Crear Mesociclo</h1>
            <p className="text-muted-foreground">Paso {step} de 3</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Configura los detalles de tu mesociclo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">Nombre del Mesociclo</Label>
                <Input
                  id="name"
                  placeholder="ej: Volumen Pecho/Espalda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label>Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Duración: {lengthWeeks} semanas</Label>
                <Slider
                  value={[lengthWeeks]}
                  onValueChange={(v) => setLengthWeeks(v[0])}
                  min={4}
                  max={8}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 4-6 semanas de acumulación + 1 semana deload
                </p>
              </div>

              <div>
                <Label>Escala de Esfuerzo</Label>
                <Select value={effortScale} onValueChange={(v: 'RIR' | 'RPE') => setEffortScale(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RIR">RIR (Reps en Reserva)</SelectItem>
                    <SelectItem value="RPE">RPE (Esfuerzo Percibido)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!canContinueStep1}
                className="w-full"
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Grupos Musculares Priorizados</CardTitle>
              <CardDescription>Selecciona los músculos en los que quieres enfocarte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {muscles?.map(muscle => (
                  <Button
                    key={muscle.id}
                    variant={selectedMuscles.includes(muscle.id) ? "default" : "outline"}
                    onClick={() => toggleMuscle(muscle.id)}
                    className="justify-start"
                  >
                    {selectedMuscles.includes(muscle.id) && (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {muscle.display_name}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canContinueStep2}
                  className="flex-1"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Volumen</CardTitle>
              <CardDescription>Define el volumen semanal target para cada músculo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedMuscles.map(muscleId => {
                const muscle = muscles?.find(m => m.id === muscleId);
                const volume = volumeTargets[muscleId]?.target || 12;
                
                return (
                  <div key={muscleId}>
                    <div className="flex items-center justify-between mb-2">
                      <Label>{muscle?.display_name}</Label>
                      <Badge variant="secondary">{volume} sets/semana</Badge>
                    </div>
                    <Slider
                      value={[volume]}
                      onValueChange={(v) => setVolumeForMuscle(muscleId, v[0])}
                      min={6}
                      max={25}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Rango: {volumeTargets[muscleId]?.min || volume - 2} - {volumeTargets[muscleId]?.max || volume + 2} sets
                    </p>
                  </div>
                );
              })}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || createMesocycle.isPending}
                  className="flex-1"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Crear Mesociclo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
