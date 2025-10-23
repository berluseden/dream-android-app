# 🎯 PLAN DE ACCIÓN INMEDIATO
## Implementación de Flujo Completo: Programas → Mesociclos → Rutinas Diarias

---

## ✅ DECISIONES CLAVE

### 1. **Flujo Principal Elegido**

```
Usuario → Browse Programs → Selecciona PPL 
  ↓
Preview Completo (Calendario 6 semanas, todos los ejercicios)
  ↓
"Usar Programa" → Wizard Pre-llenado
  ↓
Confirma y Crea → Sistema genera 36 workouts automáticamente
  ↓
Dashboard muestra: "Hoy: Push A - 7 ejercicios"
  ↓
Inicia workout → Ve ejercicios programados
```

### 2. **Prioridades de Implementación**

**FASE 1 (CRÍTICA):** Conectar todo el flujo
- ✅ Crear `workout_exercises` collection
- ✅ Generar workouts automáticamente desde programa
- ✅ Mostrar rutina del día en dashboard

**FASE 2 (IMPORTANTE):** UX mejorado
- ✅ Preview completo de programas
- ✅ Calendario visual del mesociclo
- ✅ Wizard mejorado

**FASE 3 (VALOR AÑADIDO):** AI Integration
- ✅ AI genera programas personalizados
- ✅ AI ajusta en tiempo real
- ✅ AI analiza resultados

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### SEMANA 1: Base de Datos y Backend

#### Día 1-2: Nueva Colección `workout_exercises`

```typescript
// ✅ CREAR: src/types/workout.types.ts

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;           // FK a exercises
  exercise_name: string;          // Denormalizado para historial
  order: number;                  // 1, 2, 3... (orden en sesión)
  sets_target: number;            // Del programa
  rep_range_min: number;          // Del programa
  rep_range_max: number;          // Del programa
  rir_target: number;             // Del programa
  rest_seconds: number;           // Del programa
  notes: string;                  // Notas del coach/programa
  created_at: Timestamp;
}
```

```typescript
// ✅ ACTUALIZAR: firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... reglas existentes
    
    // NUEVA: workout_exercises
    match /workout_exercises/{exerciseId} {
      allow read: if request.auth != null &&
        (resource.data.user_id == request.auth.uid ||
         hasRole('coach') ||
         hasRole('admin'));
      
      allow create: if request.auth != null &&
        (request.resource.data.user_id == request.auth.uid ||
         hasRole('coach') ||
         hasRole('admin'));
      
      allow update, delete: if request.auth != null &&
        (resource.data.user_id == request.auth.uid ||
         hasRole('coach') ||
         hasRole('admin'));
    }
  }
}
```

```json
// ✅ ACTUALIZAR: firestore.indexes.json

{
  "indexes": [
    {
      "collectionGroup": "workout_exercises",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workout_id", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    }
  ]
}
```

#### Día 3-4: Actualizar `useCreateMesocycle`

```typescript
// ✅ ACTUALIZAR: src/hooks/useMesocycles.tsx

export function useCreateMesocycle() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      name: string;
      start_date: Date;
      length_weeks: number;
      template_id: string;          // ✨ NUEVO
      effort_scale: 'RIR' | 'RPE';
      targets: Array<{
        muscle_id: string;
        sets_min: number;
        sets_max: number;
        sets_target: number;
      }>;
    }) => {
      const batch = writeBatch(db);
      
      // 1. Crear mesociclo
      const mesoRef = doc(collection(db, 'mesocycles'));
      batch.set(mesoRef, {
        user_id: data.user_id,
        coach_id: null,
        template_id: data.template_id,  // ✨ Vincular programa
        name: data.name,
        start_date: data.start_date,
        length_weeks: data.length_weeks,
        specialization: data.targets.map(t => t.muscle_id),
        effort_scale: data.effort_scale,
        status: 'active',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        created_by: user?.uid || '',
        last_modified_by: user?.uid || '',
      });
      
      // 2. Crear weekly_targets (código existente)
      for (let week = 1; week <= data.length_weeks; week++) {
        for (const target of data.targets) {
          const progression = 
            week <= 1 ? 0.6 :
            week <= 2 ? 0.7 :
            week <= 3 ? 0.8 :
            week <= 4 ? 0.9 :
            week <= 5 ? 1.0 : 0.5;  // Deload
          
          const targetRef = doc(collection(db, 'weekly_targets'));
          batch.set(targetRef, {
            mesocycle_id: mesoRef.id,
            muscle_id: target.muscle_id,
            week_number: week,
            sets_min: Math.floor(target.sets_min * progression),
            sets_max: Math.ceil(target.sets_max * progression),
            sets_target: Math.round(target.sets_target * progression),
            actual_sets: 0,
          });
        }
      }
      
      // 3. ✨ NUEVO: Generar workouts + exercises
      if (data.template_id) {
        await generateWorkoutsFromTemplate(batch, {
          mesocycleId: mesoRef.id,
          userId: data.user_id,
          templateId: data.template_id,
          startDate: data.start_date,
          lengthWeeks: data.length_weeks,
        });
      }
      
      await batch.commit();
      return { id: mesoRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
      toast({
        title: "🎉 Mesociclo creado",
        description: "Tu programa está listo. ¡Comienza tu primer entrenamiento!",
      });
    },
  });
}

// ✨ NUEVA FUNCIÓN
async function generateWorkoutsFromTemplate(
  batch: WriteBatch,
  params: {
    mesocycleId: string;
    userId: string;
    templateId: string;
    startDate: Date;
    lengthWeeks: number;
  }
) {
  // 1. Obtener template
  const templateDoc = await getDoc(doc(db, 'templates', params.templateId));
  if (!templateDoc.exists()) {
    throw new Error('Template no encontrado');
  }
  
  const template = templateDoc.data() as ProgramTemplate;
  const sessions = template.sessions;
  const daysPerWeek = template.days_per_week;
  
  // 2. Calcular schedule (qué días entrenar)
  const trainingDays = getTrainingSchedule(daysPerWeek);
  // Ejemplo: [1, 2, 3, 5, 6] para 5 días (Lun, Mar, Mié, Vie, Sáb)
  
  // 3. Generar workouts para todas las semanas
  let sessionIndex = 0;
  
  for (let week = 0; week < params.lengthWeeks; week++) {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      if (!trainingDays.includes(dayOfWeek)) continue; // Skip rest days
      
      const currentDate = addDays(addWeeks(params.startDate, week), dayOfWeek);
      const session = sessions[sessionIndex % sessions.length];
      
      // 3.1 Crear workout
      const workoutRef = doc(collection(db, 'workouts'));
      batch.set(workoutRef, {
        mesocycle_id: params.mesocycleId,
        user_id: params.userId,
        day_index: week * 7 + dayOfWeek,
        session_name: session.name,
        planned_date: currentDate,
        status: 'pending',
        completed_at: null,
        duration_minutes: null,
        notes: '',
        coach_notes: null,
        created_at: serverTimestamp(),
      });
      
      // 3.2 Crear workout_exercises
      for (let i = 0; i < session.blocks.length; i++) {
        const block = session.blocks[i];
        
        // Buscar exercise_id por nombre
        const exerciseId = await findExerciseIdByName(block.exercise_name);
        
        const exerciseRef = doc(collection(db, 'workout_exercises'));
        batch.set(exerciseRef, {
          workout_id: workoutRef.id,
          exercise_id: exerciseId || '',
          exercise_name: block.exercise_name,
          order: i + 1,
          sets_target: block.sets,
          rep_range_min: block.rep_range_min,
          rep_range_max: block.rep_range_max,
          rir_target: block.rir_target,
          rest_seconds: block.rest_seconds,
          notes: '',
          created_at: serverTimestamp(),
        });
      }
      
      sessionIndex++;
    }
  }
}

// Helper: Determinar días de entrenamiento según frecuencia
function getTrainingSchedule(daysPerWeek: number): number[] {
  const schedules: Record<number, number[]> = {
    2: [1, 4],              // Lun, Jue
    3: [1, 3, 5],           // Lun, Mié, Vie
    4: [1, 2, 4, 5],        // Lun, Mar, Jue, Vie
    5: [1, 2, 3, 5, 6],     // Lun-Mié, Vie-Sáb
    6: [1, 2, 3, 4, 5, 6],  // Lun-Sáb
  };
  
  return schedules[daysPerWeek] || [1, 3, 5];
}

// Helper: Buscar exercise_id por nombre
async function findExerciseIdByName(name: string): Promise<string | null> {
  const q = query(
    collection(db, 'exercises'),
    where('name', '==', name),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.warn(`Exercise not found: ${name}`);
    return null;
  }
  
  return snapshot.docs[0].id;
}
```

#### Día 5: Crear Hook `useTodayWorkoutDetails`

```typescript
// ✅ CREAR: src/hooks/useWorkoutDetails.ts

import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, getDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { startOfDay, addDays } from 'date-fns';
import type { Workout, Mesocycle, WorkoutExercise } from '@/types';

export function useTodayWorkoutDetails() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['today-workout-details', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      
      // 1. Buscar workout de hoy
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', user.uid),
        where('planned_date', '>=', today),
        where('planned_date', '<', tomorrow),
        where('status', 'in', ['pending', 'in_progress'])
      );
      
      const workoutSnap = await getDocs(workoutsQuery);
      if (workoutSnap.empty) return null;
      
      const workoutData = workoutSnap.docs[0].data();
      const workout: Workout = {
        id: workoutSnap.docs[0].id,
        ...workoutData,
        planned_date: workoutData.planned_date?.toDate(),
        completed_at: workoutData.completed_at?.toDate(),
      } as Workout;
      
      // 2. Obtener mesociclo
      const mesoDoc = await getDoc(doc(db, 'mesocycles', workout.mesocycle_id));
      const mesoData = mesoDoc.data();
      const mesocycle: Mesocycle = {
        id: mesoDoc.id,
        ...mesoData,
        start_date: mesoData?.start_date?.toDate(),
        created_at: mesoData?.created_at?.toDate(),
        updated_at: mesoData?.updated_at?.toDate(),
      } as Mesocycle;
      
      // 3. Obtener ejercicios del workout
      const exercisesQuery = query(
        collection(db, 'workout_exercises'),
        where('workout_id', '==', workout.id),
        orderBy('order', 'asc')
      );
      
      const exercisesSnap = await getDocs(exercisesQuery);
      const exercises: WorkoutExercise[] = exercisesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      })) as WorkoutExercise[];
      
      // 4. Calcular semana actual
      const diffTime = today.getTime() - mesocycle.start_date.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weekNumber = Math.ceil(diffDays / 7);
      
      return {
        workout,
        mesocycle,
        exercises,
        weekNumber,
        totalWeeks: mesocycle.length_weeks,
        dayNumber: workout.day_index + 1,
        totalDays: mesocycle.length_weeks * 7,
      };
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook adicional para obtener ejercicios de cualquier workout
export function useWorkoutExercises(workoutId: string) {
  return useQuery({
    queryKey: ['workout-exercises', workoutId],
    queryFn: async () => {
      const q = query(
        collection(db, 'workout_exercises'),
        where('workout_id', '==', workoutId),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      })) as WorkoutExercise[];
    },
    enabled: !!workoutId,
  });
}
```

---

### SEMANA 2: UI/UX - Dashboard y Workout Hoy

#### Día 1-3: Widget Dashboard Mejorado

```tsx
// ✅ ACTUALIZAR: src/components/dashboard/TodayWorkoutWidget.tsx

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTodayWorkoutDetails } from '@/hooks/useWorkoutDetails';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Clock, Target, Play, CheckCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function TodayWorkoutWidget() {
  const { data, isLoading } = useTodayWorkoutDetails();
  const navigate = useNavigate();
  
  if (isLoading) {
    return <CardSkeleton />;
  }
  
  if (!data) {
    return <EmptyState onCreateMesocycle={() => navigate('/mesocycles/create')} />;
  }
  
  const { workout, mesocycle, exercises, weekNumber, totalWeeks, dayNumber, totalDays } = data;
  const progressPercent = (dayNumber / totalDays) * 100;
  
  // Calcular músculos trabajados
  const musclesWorked = getMusclesFromExercises(exercises);
  
  // Estimar duración
  const estimatedDuration = exercises.length * 5; // ~5 min por ejercicio
  
  return (
    <Card className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background">
                <Calendar className="h-3 w-3 mr-1" />
                Día {dayNumber}/{totalDays}
              </Badge>
              <Badge variant="secondary">
                Semana {weekNumber}/{totalWeeks}
              </Badge>
            </div>
            
            <CardTitle className="text-2xl flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              {workout.session_name || 'Entrenamiento de Hoy'}
            </CardTitle>
            
            <CardDescription>
              {mesocycle.name} • {format(workout.planned_date, 'EEEE d MMMM', { locale: es })}
            </CardDescription>
          </div>
          
          {/* Circular progress */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercent / 100)}`}
                className="text-primary transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{Math.round(progressPercent)}%</span>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <Progress value={progressPercent} className="h-2 mt-4" />
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {/* Músculos trabajados */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Músculos de Hoy
          </h4>
          <div className="flex flex-wrap gap-2">
            {musclesWorked.map(muscle => (
              <Badge key={muscle} variant="secondary" className="gap-1">
                {getMuscleEmoji(muscle)}
                {muscle}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Lista de ejercicios */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">
              Ejercicios ({exercises.length})
            </h4>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {exercises.slice(0, 5).map((ex, idx) => (
              <div
                key={ex.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg",
                  "bg-muted/50 hover:bg-muted transition-colors"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{ex.exercise_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets_target} × {ex.rep_range_min}-{ex.rep_range_max} reps
                    {ex.rir_target && ` @ RIR ${ex.rir_target}`}
                  </p>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {ex.rest_seconds}s
                </Badge>
              </div>
            ))}
            
            {exercises.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/workout/${workout.id}`)}
              >
                +{exercises.length - 5} ejercicios más
              </Button>
            )}
          </div>
        </div>
        
        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {exercises.reduce((sum, ex) => sum + ex.sets_target, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Sets Total</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              ~{estimatedDuration}
            </div>
            <div className="text-xs text-muted-foreground">Minutos</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">
              {workout.status === 'completed' ? '✅' : '⏳'}
            </div>
            <div className="text-xs text-muted-foreground">Estado</div>
          </div>
        </div>
        
        {/* CTA */}
        {workout.status !== 'completed' ? (
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => navigate('/workout/today')}
          >
            <Play className="h-5 w-5" />
            Iniciar Entrenamiento
          </Button>
        ) : (
          <div className="text-center py-4 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="font-medium text-success">¡Entrenamiento Completado!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Próximo: Mañana - {getNextWorkoutName(workout, mesocycle)}
            </p>
          </div>
        )}
        
        {/* Link al calendario completo */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/mesocycles/${mesocycle.id}/calendar`)}
        >
          Ver Calendario Completo
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getMusclesFromExercises(exercises: WorkoutExercise[]): string[] {
  // Lógica para detectar músculos desde nombres de ejercicios
  // Esto se puede mejorar consultando la DB de exercises
  const muscles = new Set<string>();
  
  exercises.forEach(ex => {
    const name = ex.exercise_name.toLowerCase();
    if (name.includes('bench') || name.includes('press') && name.includes('chest')) {
      muscles.add('Pecho');
    }
    if (name.includes('row') || name.includes('pull')) {
      muscles.add('Espalda');
    }
    if (name.includes('squat') || name.includes('leg')) {
      muscles.add('Piernas');
    }
    // ... más lógica
  });
  
  return Array.from(muscles);
}

function getMuscleEmoji(muscle: string): string {
  const emojis: Record<string, string> = {
    'Pecho': '💪',
    'Espalda': '🏋️',
    'Piernas': '🦵',
    'Hombros': '👐',
    'Bíceps': '💪',
    'Tríceps': '💪',
    'Core': '🔥',
  };
  return emojis[muscle] || '💪';
}

function getNextWorkoutName(workout: Workout, mesocycle: Mesocycle): string {
  // Lógica para obtener nombre del próximo workout
  return 'Pull A';
}

function EmptyState({ onCreateMesocycle }: { onCreateMesocycle: () => void }) {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Sin Entrenamiento Programado</h3>
          <p className="text-sm text-muted-foreground">
            Crea un mesociclo para comenzar tu viaje de entrenamiento
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={() => window.location.href = '/programs/browse'}>
            Explorar Programas
          </Button>
          <Button variant="outline" onClick={onCreateMesocycle}>
            Crear Mesociclo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 📝 RESUMEN DEL PLAN

### Semana 1: ✅ Backend Funcional
- Día 1-2: Crear `workout_exercises` (DB + types + rules)
- Día 3-4: Actualizar `useCreateMesocycle` (generar workouts automáticos)
- Día 5: Crear `useTodayWorkoutDetails` hook

### Semana 2: ✅ UI Básica
- Día 1-3: Widget dashboard mejorado
- Día 4-5: Actualizar página `/workout/today` para usar exercises

### Semana 3: ✅ Preview y Wizard
- Día 1-2: Modal preview de programas
- Día 3-5: Wizard mejorado con pre-llenado

### Semana 4: ✅ Calendario y Stats
- Día 1-3: Página calendario del mesociclo
- Día 4-5: Testing y fixes

---

## 🚀 QUICK START

```bash
# 1. Crear branch
git checkout -b feature/program-mesocycle-integration

# 2. Crear archivo de types
touch src/types/workout-exercise.types.ts

# 3. Actualizar hooks
# Editar: src/hooks/useMesocycles.tsx
# Crear: src/hooks/useWorkoutDetails.ts

# 4. Actualizar componentes
# Crear: src/components/dashboard/TodayWorkoutWidget.tsx

# 5. Deploy Firestore rules e índices
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# 6. Testing
npm run test

# 7. Commit y push
git add .
git commit -m "feat: integrate programs with mesocycles - auto generate workouts"
git push origin feature/program-mesocycle-integration
```

---

## ✅ CRITERIOS DE ÉXITO

Al finalizar la implementación:

- [ ] Usuario puede seleccionar programa desde Browse
- [ ] Al crear mesociclo, se generan todos los workouts automáticamente
- [ ] Dashboard muestra "Hoy: Push A - 7 ejercicios"
- [ ] Al hacer clic "Iniciar", ve lista completa de ejercicios
- [ ] Cada ejercicio tiene sets, reps, RIR del programa
- [ ] Usuario puede completar workout normalmente
- [ ] 100% de mesociclos creados tienen rutinas completas
- [ ] 0% de workouts sin ejercicios

---

**¿Listo para comenzar? 🚀**

Confirma y empezamos con la implementación!
