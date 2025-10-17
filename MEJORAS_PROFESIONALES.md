# 🚀 Plan de Mejoras Profesionales
## App Hipertrofia - Optimización y Pulido Final

**Fecha:** 17 de Octubre, 2025  
**Objetivo:** Llevar la app del 85% al 100% de completitud profesional  
**Enfoque:** Optimización, corrección de deuda técnica y refinamiento UX

---

## 📋 Resumen Ejecutivo

Este documento detalla las mejoras concretas necesarias para transformar el MVP actual (85% completado) en una aplicación de entrenamiento profesional y lista para producción completa.

**Prioridades:**
1. 🔴 **Críticas** - Seguridad, bugs, hardcoded values
2. 🟡 **Altas** - UX/UI, consistencia, performance
3. 🟢 **Medias** - Nice-to-have, polish, extras

---

## 🔴 MEJORAS CRÍTICAS (Bloqueantes para Producción)

### 1. Eliminar Admin Hardcoded
**Ubicación:** `src/hooks/useAuth.tsx` línea 65-71  
**Problema:** Email hardcoded como admin es un riesgo de seguridad  
**Solución:**

```typescript
// ❌ ANTES (línea 65-71)
if (firebaseUser.email === 'berluseden@gmail.com') {
  const userProfile = await fetchProfile(firebaseUser.uid);
  setProfile(userProfile);
  setRole('admin');
  setLoading(false);
  return;
}

// ✅ DESPUÉS - Remover completamente y confiar en user_roles
const [userProfile, userRole] = await Promise.all([
  fetchProfile(firebaseUser.uid),
  fetchRole(firebaseUser.uid)
]);

setProfile(userProfile);
setRole(userRole || 'user'); // Default a 'user' si no existe rol
```

**Impacto:** Alto - Seguridad  
**Esfuerzo:** 5 min

---

### 2. Logging de Consola en Producción
**Problema:** 30+ `console.log/error/warn` en código productivo  
**Solución:** Crear wrapper de logging condicional

**Crear:** `src/lib/logger.ts`
```typescript
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: any[]) => {
    console.error(...args); // Siempre log errors
    // TODO: Enviar a servicio de monitoring (Sentry, LogRocket)
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  }
};
```

**Reemplazar en todos los archivos:**
```typescript
// ❌ ANTES
console.log('Wake Lock activado');
console.error('Error procesando acción:', error);

// ✅ DESPUÉS
import { logger } from '@/lib/logger';
logger.log('Wake Lock activado');
logger.error('Error procesando acción:', error);
```

**Impacto:** Alto - Performance y debugging  
**Esfuerzo:** 30 min

---

### 3. Variables de Entorno No Validadas
**Problema:** No hay validación de env vars al inicio  
**Solución:** Validar en `src/lib/firebase.ts`

```typescript
// Al inicio del archivo, después de imports
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

**Impacto:** Alto - Evita errores silenciosos  
**Esfuerzo:** 5 min

---

### 4. Error Boundaries Faltantes
**Problema:** Sin error boundaries en componentes clave  
**Solución:** Crear componente global

**Crear:** `src/components/ErrorBoundary.tsx`
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // TODO: Log to monitoring service
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Algo salió mal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Lo sentimos, ocurrió un error inesperado.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              )}
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Recargar Aplicación
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usar en `src/App.tsx`:**
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        {/* resto del código */}
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);
```

**Impacto:** Alto - UX y debugging  
**Esfuerzo:** 20 min

---

## 🟡 MEJORAS ALTAS (Importante para UX)

### 5. Loading States Inconsistentes
**Problema:** Algunas páginas no muestran skeleton loaders  
**Solución:** Componente reutilizable de skeleton

**Crear:** `src/components/ui/page-skeleton.tsx`
```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6 animate-pulse">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Usar en páginas:**
```typescript
// En cualquier página con data loading
if (isLoading) return <PageSkeleton />;
```

**Impacto:** Alto - UX percibida  
**Esfuerzo:** 30 min

---

### 6. Toast Notifications Inconsistentes
**Problema:** Algunos errores no muestran feedback al usuario  
**Solución:** Wrapper centralizado para toast

**Crear:** `src/lib/notifications.ts`
```typescript
import { toast } from 'sonner';

export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },
  
  error: (message: string, error?: any) => {
    const description = error?.message || 'Ocurrió un error inesperado';
    toast.error(message, { description });
    console.error(message, error); // Log para debugging
  },
  
  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },
  
  loading: (message: string) => {
    return toast.loading(message);
  },
  
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  }
};
```

**Ejemplo de uso:**
```typescript
// ❌ ANTES
try {
  await mutation.mutateAsync(data);
  toast({ title: "Éxito" });
} catch (error) {
  toast({ title: "Error", variant: "destructive" });
}

// ✅ DESPUÉS
try {
  await mutation.mutateAsync(data);
  notify.success("Mesociclo creado", "Tu plan está listo");
} catch (error) {
  notify.error("Error al crear mesociclo", error);
}
```

**Impacto:** Alto - UX y consistencia  
**Esfuerzo:** 45 min

---

### 7. Validación de Formularios Mejorada
**Problema:** Validación inconsistente entre formularios  
**Solución:** Schemas Zod centralizados

**Crear:** `src/lib/validations.ts`
```typescript
import { z } from 'zod';

export const schemas = {
  // Perfil de usuario
  userProfile: z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(50),
    email: z.string().email('Email inválido'),
    equipment: z.array(z.string()).optional(),
    level: z.enum(['novato', 'intermedio', 'avanzado']),
    experience_years: z.number().min(0).max(50),
    units: z.enum(['kg', 'lbs']),
  }),

  // Set de entrenamiento
  workoutSet: z.object({
    load: z.number().min(0, 'Carga debe ser positiva').max(1000),
    completed_reps: z.number().int().min(1).max(100),
    rir_actual: z.number().int().min(0).max(10),
    rpe: z.number().int().min(1).max(10),
  }),

  // Calibración
  calibration: z.object({
    load: z.number().min(20).max(500),
    reps: z.number().int().min(1).max(20),
    rir: z.number().int().min(0).max(5),
  }),

  // Mesociclo
  mesocycle: z.object({
    name: z.string().min(3, 'Mínimo 3 caracteres').max(100),
    length_weeks: z.number().int().min(4).max(12),
    specialization: z.array(z.string()).min(1, 'Selecciona al menos 1 músculo'),
    effort_scale: z.enum(['RIR', 'RPE']),
  }),
};
```

**Usar en formularios:**
```typescript
import { schemas } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(schemas.workoutSet),
  defaultValues: { load: 0, completed_reps: 10, rir_actual: 2, rpe: 7 }
});
```

**Impacto:** Alto - Consistencia y UX  
**Esfuerzo:** 1 hora

---

### 8. Optimización de Queries Firestore
**Problema:** Algunas queries sin paginación ni límites  
**Solución:** Implementar paginación en listas largas

**Ejemplo en `src/hooks/useWorkouts.tsx`:**
```typescript
export function useWorkouts(mesocycleId?: string, limit = 20) {
  const { user } = useAuth();
  const [lastDoc, setLastDoc] = useState<any>(null);
  
  return useQuery({
    queryKey: ['workouts', mesocycleId, user?.uid, limit],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      let q = query(
        collection(db, 'workouts'),
        where('user_id', '==', user.uid),
        orderBy('planned_date', 'desc'),
        limit(limit) // ✅ Agregar límite
      );
      
      if (mesocycleId) {
        q = query(q, where('mesocycle_id', '==', mesocycleId));
      }
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc)); // Paginación
      }
      
      const snapshot = await getDocs(q);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        planned_date: doc.data().planned_date?.toDate(),
        completed_at: doc.data().completed_at?.toDate(),
      })) as Workout[];
    },
    enabled: !!user?.uid,
  });
}
```

**Impacto:** Alto - Performance y costos  
**Esfuerzo:** 1 hora

---

### 9. Implementar Dialog de Crear Superseries
**Problema:** Documentado como "pendiente" en Sprint 2  
**Solución:** Dialog completo con selección de ejercicio

**Crear:** `src/components/workout/CreateSupersetDialog.tsx`
```typescript
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useExercises } from '@/hooks/useExercises';
import { Dumbbell, Link2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExerciseId: string;
  onCreateSuperset: (targetExerciseId: string) => void;
}

export function CreateSupersetDialog({
  open,
  onOpenChange,
  currentExerciseId,
  onCreateSuperset,
}: Props) {
  const { data: exercises = [] } = useExercises();
  const [selectedId, setSelectedId] = useState<string>('');
  
  const availableExercises = exercises.filter(e => e.id !== currentExerciseId);
  const currentExercise = exercises.find(e => e.id === currentExerciseId);

  const handleCreate = () => {
    if (selectedId) {
      onCreateSuperset(selectedId);
      onOpenChange(false);
      setSelectedId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Crear Superserie
          </DialogTitle>
          <DialogDescription>
            Combina <strong>{currentExercise?.name}</strong> con otro ejercicio
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {availableExercises.map(exercise => (
              <button
                key={exercise.id}
                onClick={() => setSelectedId(exercise.id)}
                className={`
                  w-full p-3 rounded-lg border text-left transition-all
                  hover:border-primary hover:bg-primary/5
                  ${selectedId === exercise.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{exercise.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {exercise.prime_muscle}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {exercise.difficulty}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!selectedId}>
            Crear Superserie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Integrar en `ExerciseCard.tsx`:**
```typescript
const [showSupersetDialog, setShowSupersetDialog] = useState(false);

const handleCreateSuperset = (targetExerciseId: string) => {
  const supersetGroupId = crypto.randomUUID();
  // Actualizar sets actuales con superset_group_id
  // Agregar lógica para vincular ejercicios
};

// Botón en el header del ejercicio
<Button 
  variant="ghost" 
  size="sm"
  onClick={() => setShowSupersetDialog(true)}
>
  <Link2 className="h-4 w-4 mr-2" />
  Agregar Superserie
</Button>

<CreateSupersetDialog
  open={showSupersetDialog}
  onOpenChange={setShowSupersetDialog}
  currentExerciseId={exercise.id}
  onCreateSuperset={handleCreateSuperset}
/>
```

**Impacto:** Alto - Funcionalidad core pendiente  
**Esfuerzo:** 2 horas

---

### 10. Completar "Importar Pesos Previos"
**Problema:** Botón placeholder en calibración  
**Solución:** Query real del último mesociclo

**Actualizar `src/pages/onboarding/Calibration.tsx`:**
```typescript
const importPreviousWeights = async () => {
  if (!user?.uid) return;
  
  const loadingToast = notify.loading('Importando pesos anteriores...');
  
  try {
    // 1. Buscar último mesociclo completado
    const mesocyclesQuery = query(
      collection(db, 'mesocycles'),
      where('user_id', '==', user.uid),
      where('status', '==', 'completed'),
      orderBy('start_date', 'desc'),
      limit(1)
    );
    
    const mesoSnapshot = await getDocs(mesocyclesQuery);
    if (mesoSnapshot.empty) {
      toast.dismiss(loadingToast);
      notify.info('No hay datos previos', 'Completa tu primer mesociclo para usar esta función');
      return;
    }
    
    const lastMeso = mesoSnapshot.docs[0];
    
    // 2. Buscar workouts del último mesociclo
    const workoutsQuery = query(
      collection(db, 'workouts'),
      where('mesocycle_id', '==', lastMeso.id),
      where('status', '==', 'completed'),
      orderBy('completed_at', 'desc'),
      limit(5)
    );
    
    const workoutsSnapshot = await getDocs(workoutsQuery);
    
    // 3. Buscar sets de ejercicios compound
    const compoundPatterns: Record<string, string> = {
      'squat': 'squat',
      'bench': 'bench',
      'row': 'row',
      'overhead': 'overhead_press'
    };
    
    const importedData: Record<string, any> = {};
    
    for (const workout of workoutsSnapshot.docs) {
      const setsQuery = query(
        collection(db, 'sets'),
        where('workout_id', '==', workout.id),
        where('set_type', '==', 'working')
      );
      
      const setsSnapshot = await getDocs(setsQuery);
      
      for (const setDoc of setsSnapshot.docs) {
        const set = setDoc.data();
        const exercise = await getDoc(doc(db, 'exercises', set.exercise_id));
        
        if (exercise.exists()) {
          const exerciseName = exercise.data().name.toLowerCase();
          
          // Detectar patrón
          for (const [pattern, key] of Object.entries(compoundPatterns)) {
            if (exerciseName.includes(pattern)) {
              if (!importedData[key] || set.load > importedData[key].load) {
                importedData[key] = {
                  load: set.load,
                  reps: set.completed_reps,
                  rir: set.rir_actual
                };
              }
            }
          }
        }
      }
    }
    
    // 4. Aplicar datos al formulario
    Object.entries(importedData).forEach(([pattern, data]) => {
      setFormData(prev => ({
        ...prev,
        [pattern]: data
      }));
    });
    
    toast.dismiss(loadingToast);
    notify.success(
      'Pesos importados', 
      `Se encontraron ${Object.keys(importedData).length} ejercicios previos`
    );
    
  } catch (error) {
    toast.dismiss(loadingToast);
    notify.error('Error al importar', error);
  }
};
```

**Impacto:** Alto - UX onboarding  
**Esfuerzo:** 1.5 horas

---

## 🟢 MEJORAS MEDIAS (Nice-to-have)

### 11. Dark Mode Completo
**Problema:** "Dark mode parcial" según docs  
**Solución:** Agregar toggle y completar tokens CSS

**Actualizar `src/index.css`:**
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... resto de tokens */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --secondary: 217.2 32.6% 17.5%;
    --muted: 217.2 32.6% 17.5%;
    --accent: 217.2 32.6% 17.5%;
    --destructive: 0 62.8% 30.6%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

**Crear:** `src/components/ThemeToggle.tsx`
```typescript
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initial = stored || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
```

**Agregar a `AppSidebar.tsx`:**
```typescript
import { ThemeToggle } from '@/components/ThemeToggle';

// En el footer del sidebar
<div className="p-4 border-t">
  <ThemeToggle />
</div>
```

**Impacto:** Medio - UX opcional  
**Esfuerzo:** 1 hora

---

### 12. Pull-to-Refresh en Móvil
**Problema:** "No implementado" según backlog  
**Solución:** Hook personalizado con gestos

**Crear:** `src/hooks/usePullToRefresh.tsx`
```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pullThreshold = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isRefreshing || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - startY.current;
    
    if (pullDistance > 0 && pullDistance < pullThreshold * 2) {
      // Opcional: mostrar indicador visual
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async (e: TouchEvent) => {
    if (isRefreshing || window.scrollY > 0) return;
    
    const endY = e.changedTouches[0].clientY;
    const pullDistance = endY - startY.current;
    
    if (pullDistance > pullThreshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [isRefreshing, onRefresh]);

  useEffect(() => {
    // Solo en móvil
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isRefreshing };
}
```

**Usar en páginas:**
```typescript
const queryClient = useQueryClient();

const { isRefreshing } = usePullToRefresh(async () => {
  await queryClient.invalidateQueries({ queryKey: ['workouts'] });
});
```

**Impacto:** Medio - UX móvil  
**Esfuerzo:** 1 hora

---

### 13. Shortcuts de Teclado
**Problema:** No hay atajos de teclado para acciones comunes  
**Solución:** Hook de shortcuts globales

**Crear:** `src/hooks/useKeyboardShortcuts.tsx`
```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo si no está en input/textarea
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cmd/Ctrl + K para búsqueda
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Abrir búsqueda global
      }

      // Atajos simples
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key) {
          case 'h':
            navigate('/');
            break;
          case 'e':
            navigate('/exercises');
            break;
          case 'w':
            navigate('/workouts');
            break;
          case 't':
            navigate('/workout/today');
            break;
          case 'p':
            navigate('/progress');
            break;
          case '?':
            // TODO: Mostrar modal de ayuda con shortcuts
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
```

**Usar en `App.tsx`:**
```typescript
function App() {
  useKeyboardShortcuts();
  
  return (
    // ... resto del código
  );
}
```

**Impacto:** Medio - UX power users  
**Esfuerzo:** 45 min

---

### 14. Tutorial Guiado para Nuevos Usuarios
**Problema:** Sin onboarding interactivo  
**Solución:** Tour con tooltips

**Instalar:**
```bash
npm install react-joyride
```

**Crear:** `src/components/OnboardingTour.tsx`
```typescript
import { useState, useEffect } from 'react';
import Joyride, { Step } from 'react-joyride';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const steps: Step[] = [
  {
    target: '.dashboard-hero',
    content: 'Este es tu dashboard principal. Aquí verás tu progreso semanal.',
    disableBeacon: true,
  },
  {
    target: '.today-workout-button',
    content: 'Presiona aquí para comenzar tu entrenamiento del día.',
  },
  {
    target: '.sidebar-exercises',
    content: 'Explora nuestra biblioteca de ejercicios con videos e instrucciones.',
  },
  {
    target: '.sidebar-progress',
    content: 'Revisa tus gráficas de progreso y estadísticas.',
  },
];

export function OnboardingTour() {
  const { user } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    const checkTourStatus = async () => {
      if (!user?.uid) return;
      
      const tourDoc = await getDoc(doc(db, 'user_settings', user.uid));
      const hasSeenTour = tourDoc.exists() && tourDoc.data().seen_tour;
      
      if (!hasSeenTour) {
        setTimeout(() => setRun(true), 1000); // Delay 1s
      }
    };
    
    checkTourStatus();
  }, [user]);

  const handleTourEnd = async () => {
    if (!user?.uid) return;
    
    await setDoc(doc(db, 'user_settings', user.uid), {
      seen_tour: true,
    }, { merge: true });
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={(data) => {
        if (['finished', 'skipped'].includes(data.status)) {
          handleTourEnd();
        }
      }}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
        },
      }}
    />
  );
}
```

**Usar en `Index.tsx`:**
```typescript
import { OnboardingTour } from '@/components/OnboardingTour';

export default function Index() {
  return (
    <AppLayout>
      <OnboardingTour />
      {/* resto del contenido */}
    </AppLayout>
  );
}
```

**Impacto:** Medio - Onboarding UX  
**Esfuerzo:** 1.5 horas

---

### 15. Animaciones de Transición entre Páginas
**Problema:** Sin animaciones fluidas  
**Solución:** Usar Framer Motion (ya instalado)

**Crear:** `src/components/PageTransition.tsx`
```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

export function PageTransition({ children }: Props) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Envolver páginas en `App.tsx`:**
```typescript
import { PageTransition } from '@/components/PageTransition';

<Route 
  path="/" 
  element={
    <ProtectedRoute>
      <PageTransition>
        <Index />
      </PageTransition>
    </ProtectedRoute>
  } 
/>
```

**Impacto:** Bajo - Polish visual  
**Esfuerzo:** 30 min

---

## 📊 Mejoras de Performance

### 16. Memoización de Cálculos Pesados
**Problema:** Re-cálculos innecesarios en renders  
**Solución:** `useMemo` y `useCallback`

**Ejemplo en `Index.tsx`:**
```typescript
// ✅ Memoizar cálculos costosos
const volumeChartData = useMemo(() => {
  if (!weeklyTargets || !exercises) return [];
  
  // ... lógica de cálculo
}, [weeklyTargets, exercises, volumeByMuscle, currentWeek]);

const totalStats = useMemo(() => {
  const totalPlanned = volumeChartData.reduce((sum, d) => sum + d.planificado, 0);
  const totalActual = volumeChartData.reduce((sum, d) => sum + d.realizado, 0);
  const overallAdherence = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
  
  return { totalPlanned, totalActual, overallAdherence };
}, [volumeChartData]);
```

**Impacto:** Alto - Performance  
**Esfuerzo:** Revisar todos los componentes (2 horas)

---

### 17. Lazy Loading de Imágenes
**Problema:** Sin lazy loading de iconos/imágenes  
**Solución:** Usar atributo `loading="lazy"`

**Componente wrapper:**
```typescript
export function OptimizedImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img 
      src={src} 
      alt={alt} 
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
```

**Impacto:** Medio - Performance inicial  
**Esfuerzo:** 30 min

---

### 18. Optimización de Bundle Size
**Problema:** Bundle sin analizar  
**Solución:** Visualizar y optimizar imports

**Instalar:**
```bash
npm install -D rollup-plugin-visualizer
```

**Actualizar `vite.config.ts`:**
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
```

**Impacto:** Alto - Load time  
**Esfuerzo:** 1 hora

---

## 🧪 Testing (Próxima Fase)

### 19. Setup de Testing
**Herramientas recomendadas:**
- **Vitest** - Unit tests
- **Testing Library** - Component tests
- **Playwright** - E2E tests

**Crear:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Tests prioritarios:**
1. Algoritmos (`lib/algorithms.ts`) - Unit tests
2. Hooks críticos (`useAuth`, `useWorkouts`) - Integration tests
3. Flujos principales (login, registro workout) - E2E tests

**Impacto:** Alto - Confianza en código  
**Esfuerzo:** 4-6 horas (setup + tests básicos)

---

## 📈 Plan de Implementación Sugerido

### Fase 1: Críticas (Día 1) - 2 horas
1. ✅ Eliminar admin hardcoded
2. ✅ Logger wrapper
3. ✅ Validación env vars
4. ✅ Error boundaries

### Fase 2: Altas (Días 2-3) - 6 horas
5. ✅ Loading skeletons
6. ✅ Toast notifications
7. ✅ Validación formularios
8. ✅ Optimización queries
9. ✅ Dialog superseries
10. ✅ Importar pesos previos

### Fase 3: Medias (Días 4-5) - 5 horas
11. ✅ Dark mode
12. ✅ Pull-to-refresh
13. ✅ Shortcuts teclado
14. ✅ Tutorial guiado
15. ✅ Animaciones transición

### Fase 4: Performance (Día 6) - 3 horas
16. ✅ Memoización
17. ✅ Lazy loading
18. ✅ Bundle optimization

### Fase 5: Testing (Día 7-8) - 6 horas
19. ✅ Setup + tests básicos

**Total:** ~22 horas de desarrollo (~3 días de trabajo concentrado)

---

## ✅ Checklist de Producción

Antes de lanzar a producción, verificar:

### Seguridad
- [ ] Admin hardcoded removido
- [ ] Env vars validadas
- [ ] Firestore rules testeadas
- [ ] Rate limiting en Cloud Functions
- [ ] CORS configurado correctamente

### Performance
- [ ] Lighthouse Performance ≥90
- [ ] Bundle size <500KB (gzipped)
- [ ] Lazy loading implementado
- [ ] Queries paginadas

### UX
- [ ] Loading states en todas las páginas
- [ ] Error messages claros
- [ ] Feedback toast consistente
- [ ] Validación de formularios
- [ ] Dark mode funcional

### Funcionalidad
- [ ] Superseries completamente funcional
- [ ] Importar pesos funcional
- [ ] Tour onboarding testeado
- [ ] PWA instalable y offline

### Documentación
- [ ] README actualizado
- [ ] Variables de entorno documentadas
- [ ] Deployment guide actualizado
- [ ] API docs para coaches/admins

---

## 🎯 Métricas de Éxito Post-Implementación

**Antes (MVP 85%):**
- Bundle size: ~800KB
- Lighthouse Performance: ~80
- Tiempo de logging: ~5s
- Issues conocidos: 5 críticos

**Después (Producción 100%):**
- Bundle size: <500KB ✅
- Lighthouse Performance: ≥90 ✅
- Tiempo de logging: <3s ✅
- Issues conocidos: 0 críticos ✅

---

**Documento creado:** 17 de Octubre, 2025  
**Próxima revisión:** Después de implementar Fase 1-2  
**Owner:** berluseden
