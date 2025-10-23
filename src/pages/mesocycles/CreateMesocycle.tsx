import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMuscles } from '@/hooks/useExercises';
import { useCreateMesocycle } from '@/hooks/useMesocycles';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarIcon, ArrowLeft, ArrowRight, Check, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ProgramTemplate } from '@/hooks/usePrograms';

export default function CreateMesocycle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateIdFromUrl = searchParams.get('template');
  
  const { user } = useAuth();
  const { data: muscles } = useMuscles();
  const createMesocycle = useCreateMesocycle();
  
  // ✅ CORREGIDO: Iniciar en paso 2 si viene con template desde URL
  const [step, setStep] = useState(templateIdFromUrl ? 2 : 1);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [lengthWeeks, setLengthWeeks] = useState(6);
  const [effortScale, setEffortScale] = useState<'RIR' | 'RPE'>('RIR');
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramTemplate | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [volumeTargets, setVolumeTargets] = useState<Record<string, { min: number; max: number; target: number }>>({});

  // ✨ CORREGIDO: Obtener template desde URL (local o remoto)
  const { data: templateFromUrl } = useQuery<ProgramTemplate | null>({
    queryKey: ['template', templateIdFromUrl],
    queryFn: async () => {
      if (!templateIdFromUrl) return null;
      
      // ✅ Si es un template local (local-X)
      if (templateIdFromUrl.startsWith('local-')) {
        const { getLocalTemplates } = await import('@/hooks/usePrograms');
        const localTemplates = getLocalTemplates();
        const localIndex = parseInt(templateIdFromUrl.split('-')[1]);
        return localTemplates[localIndex] || null;
      }
      
      // ✅ Si es un template remoto de Firestore
      const templateRef = doc(db, 'templates', templateIdFromUrl);
      const templateSnap = await getDoc(templateRef);
      if (!templateSnap.exists()) return null;
      return { id: templateSnap.id, ...templateSnap.data() } as ProgramTemplate;
    },
    enabled: !!templateIdFromUrl,
  });

  // ✅ CORREGIDO: Restaurar datos guardados del borrador
  useEffect(() => {
    const draft = sessionStorage.getItem('mesocycle-draft');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (!name) setName(data.name || '');
        if (!startDate && data.startDate) setStartDate(new Date(data.startDate));
        if (lengthWeeks === 6 && data.lengthWeeks) setLengthWeeks(data.lengthWeeks);
        if (effortScale === 'RIR' && data.effortScale) setEffortScale(data.effortScale);
        sessionStorage.removeItem('mesocycle-draft');
      } catch (e) {
        console.error('Error parsing draft:', e);
      }
    }
  }, []);

  // ✨ NUEVO: Pre-llenar campos con datos del template de URL
  useEffect(() => {
    if (templateFromUrl && !selectedTemplate) {
      setSelectedTemplate(templateFromUrl);
      if (!name) {
        setName(`Mesociclo ${templateFromUrl.name}`);
      }
      setLengthWeeks(templateFromUrl.weeks || 6);
      
      // ✅ CORREGIDO: Si está en paso 1 y tiene template, avanzar a paso 2
      if (step === 1) {
        setStep(2);
      }
    }
  }, [templateFromUrl, selectedTemplate, step, name]);

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

  // ✨ NUEVO: Crear mesociclo rápido con template (sin configurar músculos manualmente)
  const handleQuickCreateWithTemplate = async () => {
    if (!user || !startDate || !selectedTemplate) return;

    try {
      // Crear con targets automáticos basados en muscle_focus del template
      const autoTargets = (selectedTemplate.muscle_focus || ['chest', 'back', 'legs', 'shoulders', 'arms']).map(muscleGroup => ({
        muscle_id: muscleGroup,
        sets_min: 10,
        sets_max: 20,
        sets_target: 15,
      }));

      const result = await createMesocycle.mutateAsync({
        user_id: user.uid,
        name,
        start_date: startDate,
        length_weeks: lengthWeeks,
        specialization: selectedTemplate.muscle_focus || [],
        effort_scale: effortScale,
        targets: autoTargets,
        template_id: selectedTemplate.id,
      });

      // ✅ Esperar a que se completen las operaciones async y queries
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ✅ Navegar al dashboard que mostrará el nuevo mesociclo activo
      navigate('/');
    } catch (error: any) {
      console.error('Error creating mesocycle:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user || !startDate) return;

    try {
      const targets = selectedMuscles.map(muscleId => ({
        muscle_id: muscleId,
        sets_min: volumeTargets[muscleId].min,
        sets_max: volumeTargets[muscleId].max,
        sets_target: volumeTargets[muscleId].target,
      }));

      const result = await createMesocycle.mutateAsync({
        user_id: user.uid,
        name,
        start_date: startDate,
        length_weeks: lengthWeeks,
        specialization: selectedMuscles,
        effort_scale: effortScale,
        targets,
        template_id: selectedTemplate!.id, // ✅ Ahora siempre existe porque es validado
      });

      // ✅ Esperar a que se completen todas las operaciones async y queries se invaliden
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ✅ Siempre navegar al dashboard que mostrará el nuevo mesociclo activo
      navigate('/');
    } catch (error: any) {
      // Error is already handled by the mutation's onError
      console.error('Error creating mesocycle:', error);
    }
  };

  const canContinueStep1 = name && startDate && lengthWeeks >= 4 && lengthWeeks <= 8;
  // ✅ CORREGIDO: Ahora es obligatorio seleccionar un programa
  const canContinueStep2 = !!selectedTemplate;
  const canContinueStep3 = selectedMuscles.length > 0;
  const canSubmit = selectedMuscles.every(id => volumeTargets[id]);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {selectedTemplate ? 'Iniciar Programa de Entrenamiento' : 'Crear Mesociclo'}
            </h1>
            <p className="text-muted-foreground">
              {selectedTemplate ? 'Configura tu fecha de inicio' : `Paso ${step} de 4`}
            </p>
          </div>
        </div>

        {!selectedTemplate && (
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        )}

        {/* ✨ Formulario simplificado cuando hay template */}
        {selectedTemplate && (
          <>
            <Alert className="mb-6 border-primary/50 bg-primary/5">
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Programa Seleccionado</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  <p className="font-medium text-lg">{selectedTemplate.name}</p>
                  <p className="text-sm">{selectedTemplate.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{selectedTemplate.days_per_week} días/semana</Badge>
                    <Badge variant="secondary">{selectedTemplate.weeks} semanas</Badge>
                    <Badge variant="secondary">{selectedTemplate.split}</Badge>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Configuración Rápida</CardTitle>
                <CardDescription>
                  Solo necesitamos algunos detalles para comenzar tu entrenamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="quick-name">Nombre de tu Mesociclo</Label>
                  <Input
                    id="quick-name"
                    placeholder={`Mi ${selectedTemplate.name}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Puedes dejarlo como está o personalizarlo
                  </p>
                </div>

                <div>
                  <Label>¿Cuándo quieres comenzar?</Label>
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
                        {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Recomendamos comenzar un lunes para mejor organización
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Lo que se generará automáticamente:
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ {(selectedTemplate.sessions?.length || 0) * selectedTemplate.weeks} entrenamientos programados</li>
                    <li>✓ Todos los ejercicios con series, reps y RIR</li>
                    <li>✓ Calendario completo de {selectedTemplate.weeks} semanas</li>
                    <li>✓ Progresión automática de volumen</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/programs/browse')}
                    className="flex-1"
                  >
                    Cambiar Programa
                  </Button>
                  <Button
                    onClick={handleQuickCreateWithTemplate}
                    disabled={!name || !startDate || createMesocycle.isPending}
                    className="flex-1"
                  >
                    {createMesocycle.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {createMesocycle.isPending ? 'Creando...' : 'Crear y Ver Calendario'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

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
              <CardTitle>Seleccionar Programa (Opcional)</CardTitle>
              <CardDescription>Elige un programa predefinido o continúa para crear uno manual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <Alert className="border-primary/50 bg-primary/5">
                      <Check className="h-4 w-4 text-primary" />
                      <AlertTitle>✅ Programa Seleccionado</AlertTitle>
                      <AlertDescription>
                        <div className="mt-3 space-y-3">
                          <div>
                            <h3 className="font-bold text-lg text-foreground">{selectedTemplate.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.description}</p>
                          </div>
                          
                          {/* Badges con información del programa */}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              📅 {selectedTemplate.weeks} semanas
                            </Badge>
                            <Badge variant="secondary">
                              💪 {selectedTemplate.days_per_week} días/semana
                            </Badge>
                            <Badge variant="secondary">
                              🏋️ {selectedTemplate.split}
                            </Badge>
                            {selectedTemplate.level && (
                              <Badge variant="outline">
                                {selectedTemplate.level === 'beginner' ? '🟢 Principiante' : 
                                 selectedTemplate.level === 'intermediate' ? '🟡 Intermedio' : 
                                 '🔴 Avanzado'}
                              </Badge>
                            )}
                          </div>

                          {/* Vista previa de sesiones */}
                          {selectedTemplate.sessions && selectedTemplate.sessions.length > 0 && (
                            <div className="border rounded-lg p-3 bg-background/50">
                              <h4 className="font-semibold text-sm mb-2 text-foreground">
                                Vista Previa de Entrenamientos:
                              </h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {selectedTemplate.sessions.slice(0, 3).map((session: any, idx: number) => (
                                  <div key={idx} className="text-sm border-l-2 border-primary pl-3 py-1">
                                    <p className="font-medium text-foreground">{session.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {session.blocks?.length || 0} ejercicios
                                    </p>
                                  </div>
                                ))}
                                {selectedTemplate.sessions.length > 3 && (
                                  <p className="text-xs text-muted-foreground pl-3">
                                    +{selectedTemplate.sessions.length - 3} días más...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(null);
                              // Limpiar el template de la URL
                              navigate('/mesocycles/create', { replace: true });
                            }}
                            className="w-full"
                          >
                            🔄 Cambiar Programa
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                 ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">
                      Puedes elegir un programa del catálogo o crear uno manual
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // ✅ CORREGIDO: Guardar estado antes de navegar
                          sessionStorage.setItem('mesocycle-draft', JSON.stringify({
                            name,
                            startDate: startDate?.toISOString(),
                            lengthWeeks,
                            effortScale
                          }));
                          navigate('/programs/browse');
                        }}
                       >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Explorar Programas
                      </Button>
                    </div>
                    {!selectedTemplate && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTitle>⚠️ Programa Requerido</AlertTitle>
                        <AlertDescription>
                          Debes seleccionar un programa de entrenamiento para continuar.
                          Los programas profesionales garantizan resultados óptimos.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
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
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!canContinueStep3}
                  className="flex-1"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
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
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || createMesocycle.isPending}
                  className="flex-1"
                >
                  {createMesocycle.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Crear Mesociclo
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
