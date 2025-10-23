# 📊 ANÁLISIS COMPLETO DE FLUJOS DE USUARIO
## Vinculación de Mesociclos con Programas y Rutinas Diarias

---

## 🎯 OBJETIVO

Implementar un sistema que permita:
1. **Seleccionar un programa** (template) al crear un mesociclo
2. **Generar automáticamente las rutinas diarias** basadas en el programa
3. **Mostrar al usuario su rutina del día** en su perfil/dashboard

---

## 📋 ESTADO ACTUAL DEL SISTEMA

### 1. **Arquitectura de Datos Existente**

#### Colecciones Firestore:

```typescript
// ✅ EXISTE
templates/ (programs)
  ├── id: string
  ├── name: string
  ├── description: string
  ├── days_per_week: number
  ├── weeks: number
  ├── level: string
  ├── focus: 'hypertrophy' | 'strength' | 'powerbuilding'
  ├── required_equipment: string[]
  ├── muscle_focus: string[]
  └── sessions: [
        {
          name: string,
          blocks: [
            {
              exercise_name: string,
              sets: number,
              rep_range_min: number,
              rep_range_max: number,
              rir_target: number,
              rest_seconds: number
            }
          ]
        }
      ]

// ✅ EXISTE
mesocycles/
  ├── id: string
  ├── user_id: string
  ├── template_id: string  // ⚠️ EXISTE PERO NO SE USA
  ├── name: string
  ├── start_date: Date
  ├── length_weeks: number
  ├── specialization: string[]  // Músculos priorizados
  ├── effort_scale: 'RIR' | 'RPE'
  └── status: 'planned' | 'active' | 'completed' | 'paused'

// ✅ EXISTE
workouts/
  ├── id: string
  ├── mesocycle_id: string
  ├── user_id: string
  ├── day_index: number  // Día del mesociclo (0-indexed)
  ├── planned_date: Date
  ├── completed_at: Date | null
  ├── status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ├── duration_minutes: number | null
  ├── notes: string
  └── coach_notes: string | null

// ⚠️ NO EXISTE - NECESITA CREARSE
workout_exercises/
  ├── id: string
  ├── workout_id: string
  ├── exercise_id: string
  ├── order: number
  ├── sets_target: number
  ├── rep_range_min: number
  ├── rep_range_max: number
  ├── rir_target: number
  ├── rest_seconds: number
  └── notes: string

// ✅ EXISTE
sets/
  ├── id: string
  ├── workout_id: string
  ├── exercise_id: string
  ├── set_number: number
  ├── set_type: 'warmup' | 'working'
  ├── load: number
  ├── completed_reps: number
  ├── rir_actual: number
  ├── rpe: number
  └── perceived_pump: number
```

### 2. **Flujo Actual de Creación de Mesociclo**

```
Usuario → /mesocycles/create
  ↓
Step 1: Info Básica
  • Nombre del mesociclo
  • Fecha de inicio
  • Duración (4-12 semanas)
  • Sistema de esfuerzo (RIR/RPE)
  ↓
Step 2: Músculos a Especializar
  • Selecciona de 1-3 músculos prioritarios
  • Ej: Pecho, Espalda, Piernas
  ↓
Step 3: Targets de Volumen
  • Define rangos por músculo
  • Min, Max, Target sets semanales
  • Ej: Pecho 10-20 sets, target 15
  ↓
Sistema Crea:
  ✅ Mesociclo en Firestore
  ✅ weekly_targets con progresión automática
  ❌ NO crea workouts programados
  ❌ NO vincula con ningún template
  ❌ NO asigna ejercicios a los días
```

**PROBLEMA:** 
- El usuario crea un mesociclo pero **no sabe qué entrenar cada día**
- Tiene que crear manualmente los ejercicios en cada workout
- No hay vinculación con los programas del catálogo

---

## 🔄 FLUJOS DE USUARIO - ANÁLISIS DETALLADO

### FLUJO 1: Explorar y Seleccionar Programa

#### Estado Actual ✅
```
Usuario → /programs/browse
  ↓
Ve catálogo de programas:
  • Upper/Lower 4 días
  • Push/Pull/Legs 6 días
  • Arnold Split 6 días
  • nSuns 5/3/1
  • Especializaciones (Pecho, Espalda, Delts)
  ↓
Filtra por:
  • Días por semana (2-7)
  • Nivel (beginner/intermediate/advanced)
  • Equipo disponible
  • Enfoque (hypertrophy/strength/powerbuilding)
  ↓
Selecciona programa → Ve preview con:
  • Detalles del programa
  • Sesiones y ejercicios
  • Volumen estimado
  ↓
Clic "Usar Programa"
  ↓
❌ Solo muestra toast "Programa clonado"
❌ NO crea mesociclo
❌ NO genera rutinas
```

#### Flujo Propuesto ✨
```
Usuario → /programs/browse
  ↓
Selecciona programa → Clic "Usar Programa"
  ↓
Redirige a /mesocycles/create?template_id=XXX
  ↓
Wizard PRE-LLENADO con datos del programa:
  • Nombre: "PPL - Octubre 2025"
  • Duración: 6 semanas (del programa)
  • Músculos: Automático según programa.muscle_focus
  • Volumen: Calculado según programa.sessions
  ↓
Usuario puede ajustar:
  • Fecha inicio
  • Nombre personalizado
  • Targets de volumen (si quiere)
  ↓
Clic "Crear Mesociclo"
  ↓
Sistema genera:
  ✅ Mesociclo con template_id vinculado
  ✅ weekly_targets con progresión
  ✅ workouts programados (día por día)
  ✅ workout_exercises con ejercicios del programa
  ↓
Redirige a /dashboard
  • Ve "Mesociclo activo: PPL - Octubre 2025"
  • Ve "Hoy: Día 1 - Push A"
  • Ve ejercicios del día listados
```

---

### FLUJO 2: Ver Rutina del Día

#### Estado Actual ✅
```
Usuario → /dashboard o /
  ↓
Ve widget "Entrenamiento de Hoy"
  ↓
Si tiene mesociclo activo:
  ✅ Muestra nombre del mesociclo
  ✅ Muestra semana actual
  ❌ NO muestra ejercicios del día
  ❌ NO muestra nombre de la sesión
  ↓
Clic "Iniciar Entrenamiento"
  ↓
Va a /workout/today
  ↓
❓ Carga ejercicios... pero ¿de dónde?
  • Actualmente parece cargar desde useExercises()
  • NO hay filtro por workout del día
  • NO hay estructura de "sesión del día"
```

#### Flujo Propuesto ✨
```
Usuario → /dashboard
  ↓
Widget "Entrenamiento de Hoy" muestra:
  📅 Fecha: Miércoles 23 Oct
  🏋️ Sesión: Push A - Pecho y Hombros
  📋 Mesociclo: PPL - Octubre 2025 (Semana 2/6)
  
  Ejercicios (preview):
    1. Press Banca 4x8-10
    2. Press Inclinado 3x10-12
    3. Press Militar 3x8-10
    ... +3 más
  
  [Iniciar Entrenamiento →]
  ↓
Clic "Iniciar"
  ↓
Va a /workout/today
  ↓
Carga workout del día:
  • workout.id
  • workout.mesocycle_id
  • workout.day_index
  ↓
Carga workout_exercises:
  • Ejercicios en orden
  • Sets, reps, RIR targets
  • Instrucciones
  ↓
Usuario completa sets:
  • Añade warmups si es compound
  • Registra working sets
  • Feedback por ejercicio
  ↓
Completa workout
  ↓
Vuelve a dashboard
  • Widget ahora muestra "✅ Completado hoy"
  • Muestra siguiente entrenamiento
```

---

### FLUJO 3: Perfil de Usuario con Programa Actual

#### Estado Actual ⚠️
```
Usuario → /profile o /settings
  ↓
Ve:
  ✅ Información personal
  ✅ Objetivos
  ✅ Configuraciones
  ❌ NO ve programa actual
  ❌ NO ve calendario de entrenamientos
  ❌ NO ve progreso del mesociclo
```

#### Flujo Propuesto ✨
```
Usuario → /profile
  ↓
Sección "Mi Programa Actual":
  
  📊 Mesociclo Activo
    • Nombre: PPL - Octubre 2025
    • Programa base: Push/Pull/Legs 6d
    • Progreso: Semana 2 de 6 (33%)
    • Adherencia: 85% (11/13 sesiones)
    
  📅 Calendario Semanal:
    Lun: Push A ✅
    Mar: Pull A ✅
    Mié: Legs A ✅
    Jue: Push B ⏳ (hoy)
    Vie: Pull B
    Sáb: Legs B
    Dom: Descanso
  
  📈 Volumen Semanal:
    Pecho: 14/16 sets ▓▓▓▓▓▓▓▓░░
    Espalda: 18/20 sets ▓▓▓▓▓▓▓▓▓░
    Piernas: 12/18 sets ▓▓▓▓▓░░░░░
  
  [Ver Historial Completo →]
  [Cambiar Programa →]
```

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA REQUERIDA

### 1. **Nueva Colección: `workout_exercises`**

```typescript
interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order: number;                // Orden en la sesión (1, 2, 3...)
  sets_target: number;          // Del programa
  rep_range_min: number;        // Del programa
  rep_range_max: number;        // Del programa
  rir_target: number;           // Del programa
  rest_seconds: number;         // Del programa
  notes: string;                // Notas del coach/programa
  created_at: Timestamp;
}
```

### 2. **Actualizar Hook: `useCreateMesocycle`**

```typescript
// ACTUAL
export function useCreateMesocycle() {
  return useMutation({
    mutationFn: async (data) => {
      const batch = writeBatch(db);
      
      // Crear mesociclo
      const mesoRef = doc(collection(db, 'mesocycles'));
      batch.set(mesoRef, { ...data, template_id: '' });
      
      // Crear weekly_targets
      for (let week = 1; week <= data.length_weeks; week++) {
        // ... código existente
      }
      
      await batch.commit();
      return mesoRef.id;
    }
  });
}

// PROPUESTO
export function useCreateMesocycle() {
  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      name: string;
      start_date: Date;
      length_weeks: number;
      template_id: string;  // ✨ NUEVO
      effort_scale: 'RIR' | 'RPE';
      targets: Array<...>;
    }) => {
      const batch = writeBatch(db);
      
      // 1. Crear mesociclo
      const mesoRef = doc(collection(db, 'mesocycles'));
      batch.set(mesoRef, {
        ...data,
        template_id: data.template_id,  // ✨ VINCULA PROGRAMA
        status: 'active',
        created_at: serverTimestamp(),
      });
      
      // 2. Crear weekly_targets (código existente)
      // ...
      
      // 3. ✨ NUEVO: Generar workouts programados
      if (data.template_id) {
        const template = await getDoc(doc(db, 'templates', data.template_id));
        const templateData = template.data() as ProgramTemplate;
        
        const totalDays = data.length_weeks * 7;
        const sessions = templateData.sessions;
        const daysPerWeek = templateData.days_per_week;
        
        let workoutIndex = 0;
        
        for (let day = 0; day < totalDays; day++) {
          const currentDate = addDays(data.start_date, day);
          const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat
          
          // Determinar si es día de entrenamiento según el programa
          const isTrainingDay = shouldTrain(dayOfWeek, daysPerWeek);
          
          if (isTrainingDay) {
            const sessionIndex = workoutIndex % sessions.length;
            const session = sessions[sessionIndex];
            
            // Crear workout
            const workoutRef = doc(collection(db, 'workouts'));
            batch.set(workoutRef, {
              mesocycle_id: mesoRef.id,
              user_id: data.user_id,
              day_index: day,
              session_name: session.name,  // ✨ NUEVO
              planned_date: currentDate,
              status: 'pending',
              completed_at: null,
              duration_minutes: null,
              notes: '',
              coach_notes: null,
              created_at: serverTimestamp(),
            });
            
            // Crear workout_exercises
            session.blocks.forEach((block, index) => {
              const exerciseRef = doc(collection(db, 'workout_exercises'));
              batch.set(exerciseRef, {
                workout_id: workoutRef.id,
                exercise_name: block.exercise_name,
                order: index + 1,
                sets_target: block.sets,
                rep_range_min: block.rep_range_min,
                rep_range_max: block.rep_range_max,
                rir_target: block.rir_target,
                rest_seconds: block.rest_seconds,
                notes: '',
                created_at: serverTimestamp(),
              });
            });
            
            workoutIndex++;
          }
        }
      }
      
      await batch.commit();
      return mesoRef.id;
    }
  });
}

// Helper function
function shouldTrain(dayOfWeek: number, daysPerWeek: number): boolean {
  // Ejemplo para diferentes frecuencias:
  const schedules: Record<number, number[]> = {
    3: [1, 3, 5],           // Lun, Mié, Vie
    4: [1, 2, 4, 5],        // Lun, Mar, Jue, Vie
    5: [1, 2, 3, 4, 5],     // Lun-Vie
    6: [1, 2, 3, 4, 5, 6],  // Lun-Sáb
  };
  
  const schedule = schedules[daysPerWeek] || [];
  return schedule.includes(dayOfWeek);
}
```

### 3. **Nuevo Hook: `useTodayWorkoutDetails`**

```typescript
export function useTodayWorkoutDetails() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['today-workout-details', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const today = startOfDay(new Date());
      
      // 1. Buscar workout de hoy
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', user.uid),
        where('planned_date', '>=', today),
        where('planned_date', '<', addDays(today, 1)),
        where('status', 'in', ['pending', 'in_progress'])
      );
      
      const workoutSnap = await getDocs(workoutsQuery);
      if (workoutSnap.empty) return null;
      
      const workout = {
        id: workoutSnap.docs[0].id,
        ...workoutSnap.docs[0].data(),
      } as Workout;
      
      // 2. Obtener mesociclo
      const mesoDoc = await getDoc(doc(db, 'mesocycles', workout.mesocycle_id));
      const mesocycle = { id: mesoDoc.id, ...mesoDoc.data() } as Mesocycle;
      
      // 3. Obtener ejercicios del workout
      const exercisesQuery = query(
        collection(db, 'workout_exercises'),
        where('workout_id', '==', workout.id),
        orderBy('order', 'asc')
      );
      
      const exercisesSnap = await getDocs(exercisesQuery);
      const exercises = exercisesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WorkoutExercise[];
      
      // 4. Calcular semana actual
      const weekNumber = Math.ceil(
        (today.getTime() - mesocycle.start_date.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      return {
        workout,
        mesocycle,
        exercises,
        weekNumber,
        totalWeeks: mesocycle.length_weeks,
      };
    },
    enabled: !!user?.uid,
  });
}
```

### 4. **Actualizar Componente: Dashboard Widget**

```tsx
// src/components/dashboard/TodayWorkoutWidget.tsx

export function TodayWorkoutWidget() {
  const { data, isLoading } = useTodayWorkoutDetails();
  const navigate = useNavigate();
  
  if (isLoading) return <Skeleton />;
  
  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="font-medium mb-2">Sin entrenamiento programado</p>
          <p className="text-sm text-muted-foreground mb-4">
            Crea un mesociclo para comenzar
          </p>
          <Button onClick={() => navigate('/mesocycles/create')}>
            Crear Mesociclo
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const { workout, mesocycle, exercises, weekNumber, totalWeeks } = data;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Entrenamiento de Hoy</CardTitle>
            <CardDescription>
              {mesocycle.name} • Semana {weekNumber}/{totalWeeks}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {format(workout.planned_date, 'EEE d MMM', { locale: es })}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Nombre de la sesión */}
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">{workout.session_name}</h3>
        </div>
        
        {/* Preview de ejercicios */}
        <div className="space-y-2">
          {exercises.slice(0, 4).map((ex, idx) => (
            <div key={ex.id} className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground w-5">{idx + 1}.</span>
              <span className="flex-1">{ex.exercise_name}</span>
              <span className="text-muted-foreground">
                {ex.sets_target}×{ex.rep_range_min}-{ex.rep_range_max}
              </span>
            </div>
          ))}
          
          {exercises.length > 4 && (
            <p className="text-sm text-muted-foreground pl-8">
              +{exercises.length - 4} ejercicios más
            </p>
          )}
        </div>
        
        {/* Volumen estimado */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {exercises.reduce((sum, ex) => sum + ex.sets_target, 0)} sets totales
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              ~{Math.round(exercises.length * 5)} min estimados
            </span>
          </div>
        </div>
        
        <Button 
          onClick={() => navigate('/workout/today')}
          className="w-full"
          size="lg"
        >
          Iniciar Entrenamiento
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 5. **Actualizar Página: Browse Programs**

```tsx
// src/pages/programs/Browse.tsx

const handleUseProgram = async (program: ProgramTemplate) => {
  // ANTES: Solo mostraba toast
  // await cloneTemplate.mutateAsync(program.id);
  
  // AHORA: Redirige a crear mesociclo con programa pre-seleccionado
  navigate(`/mesocycles/create?template_id=${program.id}`);
};
```

### 6. **Actualizar Página: Create Mesocycle**

```tsx
// src/pages/mesocycles/CreateMesocycle.tsx

export default function CreateMesocycle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template_id');
  
  // Cargar programa si viene de Browse
  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const doc = await getDoc(doc(db, 'templates', templateId));
      return { id: doc.id, ...doc.data() } as ProgramTemplate;
    },
    enabled: !!templateId,
  });
  
  // Pre-llenar wizard si hay template
  useEffect(() => {
    if (template) {
      setName(`${template.name} - ${format(new Date(), 'MMMM yyyy')}`);
      setLengthWeeks(template.weeks);
      setSelectedMuscles(template.muscle_focus || []);
      // Calcular volumen automático según sesiones del programa
      const estimatedVolume = calculateVolumeFromSessions(template.sessions);
      setVolumeTargets(estimatedVolume);
    }
  }, [template]);
  
  // ... resto del componente
  
  const handleCreate = async () => {
    await createMesocycle.mutateAsync({
      user_id: user!.uid,
      name,
      start_date: startDate!,
      length_weeks: lengthWeeks,
      template_id: templateId || '',  // ✨ Vincula programa
      effort_scale: effortScale,
      specialization: selectedMuscles,
      targets: Object.entries(volumeTargets).map(([muscle_id, vol]) => ({
        muscle_id,
        ...vol,
      })),
    });
    
    navigate('/');
  };
}
```

---

## 📊 RESUMEN DE CAMBIOS

### Base de Datos
- ✨ **Nueva colección**: `workout_exercises`
- ✨ **Nuevo campo**: `workouts.session_name`
- ✅ **Usar campo existente**: `mesocycles.template_id`

### Hooks Nuevos
- ✨ `useTodayWorkoutDetails()` - Obtiene workout + ejercicios del día
- ✨ `useWorkoutExercises(workoutId)` - Lista ejercicios de un workout

### Hooks Actualizados
- 🔄 `useCreateMesocycle()` - Genera workouts + exercises automáticamente
- 🔄 `useTodayWorkout()` - Retorna más información (sesión, ejercicios)

### Componentes Nuevos
- ✨ `TodayWorkoutWidget` - Widget mejorado para dashboard
- ✨ `WorkoutCalendarView` - Vista semanal/mensual de entrenamientos
- ✨ `ProgramProgressCard` - Card de progreso en perfil

### Páginas Actualizadas
- 🔄 `/programs/browse` - Botón "Usar" redirige a crear mesociclo
- 🔄 `/mesocycles/create` - Pre-llena datos desde programa
- 🔄 `/workout/today` - Carga ejercicios desde workout_exercises
- 🔄 `/profile` - Muestra programa actual y calendario

### Flujos Afectados
1. ✅ **Seleccionar programa** → Vincula automáticamente al mesociclo
2. ✅ **Crear mesociclo** → Genera rutinas diarias completas
3. ✅ **Ver dashboard** → Muestra rutina del día con ejercicios
4. ✅ **Ver perfil** → Muestra programa activo y progreso
5. ✅ **Entrenar** → Carga ejercicios programados del día

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Base de Datos (1-2 días)
1. Crear colección `workout_exercises`
2. Añadir campo `session_name` a `workouts`
3. Actualizar reglas de Firestore
4. Crear índices compuestos necesarios

### Fase 2: Backend Logic (2-3 días)
1. Implementar `useCreateMesocycle` mejorado
2. Crear función `generateWorkoutsFromTemplate()`
3. Crear hooks `useTodayWorkoutDetails()` y `useWorkoutExercises()`
4. Testear generación automática de rutinas

### Fase 3: UI Components (2-3 días)
1. Crear `TodayWorkoutWidget` mejorado
2. Actualizar wizard de crear mesociclo
3. Actualizar página de Browse Programs
4. Crear vista de calendario en perfil

### Fase 4: Integration (1-2 días)
1. Integrar nuevo widget en dashboard
2. Actualizar `/workout/today` para usar `workout_exercises`
3. Testing end-to-end de flujo completo
4. Ajustes de UX y feedback

### Fase 5: Polish (1 día)
1. Animaciones y transiciones
2. Estados de carga
3. Mensajes de error mejorados
4. Documentación de usuario

**TIEMPO TOTAL ESTIMADO: 7-11 días**

---

## 🎯 BENEFICIOS PARA EL USUARIO

### Antes ❌
- Crea mesociclo "vacío"
- No sabe qué entrenar cada día
- Tiene que inventar ejercicios
- No hay estructura clara
- Difícil seguir un programa conocido

### Después ✅
- Elige programa probado del catálogo
- Ve su rutina del día al entrar
- Ejercicios programados automáticamente
- Progresión clara semana a semana
- Puede seguir PPL, Upper/Lower, Arnold, etc.
- Dashboard muestra "Hoy: Push A - 7 ejercicios"
- Perfil muestra calendario completo del mes

---

## 📈 MÉTRICAS DE ÉXITO

- ✅ 100% de mesociclos creados con template vinculado
- ✅ 90%+ de usuarios ven su rutina del día en < 3 clics
- ✅ Reducción 80% en workouts sin ejercicios
- ✅ Aumento 50% en adherencia (más claridad = más cumplimiento)
- ✅ NPS +15 puntos por mejor UX

---

## 🤔 CONSIDERACIONES ADICIONALES

### ¿Qué pasa si el usuario quiere personalizar?
- Permitir editar ejercicios después de crear mesociclo
- Botón "Personalizar día" en cada workout
- Cambios se guardan en `workout_exercises` específicos
- No afecta el template original

### ¿Y si quiere crear mesociclo sin programa?
- Mantener opción "Crear desde cero"
- Wizard actual sigue funcionando
- Genera workouts vacíos que puede llenar manualmente

### ¿Cómo manejar deloads?
- Programas incluyen semanas de deload
- Sistema detecta semana deload (volumen -40%)
- Reduce sets automáticamente en `workout_exercises`

### ¿Y la progresión de carga?
- Algoritmo actual (AI suggestions) se mantiene
- `workout_exercises` guarda targets, no cargas específicas
- Usuario ajusta carga set por set según RIR

---

## ✅ CONCLUSIÓN

Esta implementación **conecta todos los puntos** del sistema:

1. **Programas** (catálogo) → **Mesociclos** (planificación) → **Workouts** (ejecución) → **Sets** (registro)

2. El usuario tiene **claridad total** desde día 1

3. Se aprovecha el **catálogo de programas existente**

4. **Escalable**: Admins pueden añadir más programas fácilmente

5. **Flexible**: Usuario puede personalizar después si quiere

¿Procedemos con la implementación? 🚀
