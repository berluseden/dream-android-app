# 📋 Levantamiento Funcional Completo
## App Hipertrofia - Sistema de Planificación de Entrenamientos

**Fecha:** 17 de Octubre, 2025  
**Estado:** Producción (MVP)  
**Repositorio:** berluseden/dream-android-app  
**Branch:** main

---

## 📊 Resumen Ejecutivo

### Stack Tecnológico
- **Frontend:** React 18 + Vite + TypeScript
- **UI:** TailwindCSS + Radix UI (shadcn/ui)
- **Backend:** Firebase (Auth, Firestore, Cloud Functions, Storage)
- **Estado Global:** TanStack Query (React Query) v5
- **Routing:** React Router v6
- **PWA:** vite-plugin-pwa con Service Worker
- **Runtime:** Node 18 (Cloud Functions)

### Dependencias Principales
```json
{
  "firebase": "^12.4.0",
  "@tanstack/react-query": "^5.83.0",
  "react": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "framer-motion": "^11.18.2",
  "recharts": "^2.15.4",
  "date-fns": "^3.6.0",
  "zod": "^3.25.76",
  "react-hook-form": "^7.61.1"
}
```

---

## 🏗️ Arquitectura del Sistema

### Modelo de Datos (Firestore)

#### Colecciones Principales

**1. `users/` - Perfiles de Usuario**
```typescript
{
  email: string;
  name: string;
  equipment: string[];            // Equipamiento disponible
  level: 'novato' | 'intermedio' | 'avanzado';
  experience_years: number;
  goals: string;
  units: 'kg' | 'lbs';
  coach_id: string | null;        // Coach asignado
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**2. `user_roles/` - Sistema de Roles (Separado por Seguridad)**
```typescript
{
  // Document ID = user_id
  role: 'admin' | 'coach' | 'user';
}
```

**3. `muscles/` - Catálogo de Músculos**
```typescript
{
  name: string;                   // ej: "Pectorales"
  category: string;               // ej: "upper_body"
  recovery_days: number;          // Días de recuperación típicos
}
```

**4. `exercises/` - Biblioteca de Ejercicios**
```typescript
{
  name: string;
  prime_muscle: string;           // Músculo principal
  secondary_muscles: string[];    // Músculos secundarios
  equipment: string[];            // Equipamiento requerido
  difficulty: 'novato' | 'intermedio' | 'avanzado';
  instructions: string;
  video_url: string | null;
  created_by: string;
  created_at: Timestamp;
}
```

**5. `mesocycles/` - Ciclos de Entrenamiento**
```typescript
{
  user_id: string;
  coach_id: string | null;
  name: string;
  start_date: Timestamp;
  length_weeks: number;           // Duración total (ej: 6 semanas)
  specialization: string[];       // Músculos a especializar
  effort_scale: 'RIR' | 'RPE';    // Sistema de esfuerzo
  status: 'planned' | 'active' | 'completed' | 'paused';
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: string;
  last_modified_by: string;
}
```

**6. `weekly_targets/` - Objetivos Semanales de Volumen**
```typescript
{
  mesocycle_id: string;
  muscle_id: string;
  week_number: number;            // 1 a length_weeks
  sets_min: number;               // Rango mínimo de sets
  sets_max: number;               // Rango máximo de sets
  sets_target: number;            // Sets objetivo
  actual_sets: number;            // Sets completados (auto-actualizado)
}
```
**Progresión:** 60% → 70% → 80% → 90% → 100% → 50% (deload)

**7. `workouts/` - Sesiones de Entrenamiento**
```typescript
{
  mesocycle_id: string;
  user_id: string;
  day_index: number;              // Día del mesociclo (0-indexed)
  planned_date: Timestamp;
  completed_at: Timestamp | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  duration_minutes: number | null;
  notes: string;
  coach_notes: string | null;
}
```

**8. `sets/` - Registro de Series**
```typescript
{
  workout_id: string;
  exercise_id: string;
  set_number: number;             // Número de serie (1, 2, 3...)
  set_type: 'warmup' | 'working' | 'dropset' | 'backoff';
  target_reps: number;
  rir_target: number;             // RIR objetivo
  load: number;                   // Carga en kg/lbs
  completed_reps: number;
  rir_actual: number;             // RIR real
  rpe: number;                    // RPE (1-10)
  perceived_pump: number;         // Pump 1-10
  perceived_soreness: number;     // Soreness 1-10
  notes: string;
  rest_seconds?: number;
  tempo?: string;
  technique?: string;
  superset_group_id?: string;     // UUID para agrupar superseries
  created_at: Timestamp;
  modified_by: string;
}
```

**9. `exercise_feedback/` - Feedback Post-Ejercicio**
```typescript
{
  workout_id: string;
  exercise_id: string;
  user_id: string;
  muscle_soreness: 'never_sore' | 'healed_while_ago' | 'just_on_time' | 'still_sore';
  pump_quality: 'low' | 'moderate' | 'amazing';
  workload_feeling: 'easy' | 'pretty_good' | 'pushed_limits' | 'too_much';
  notes?: string;
  created_at: Timestamp;
}
```

**10. `user_strength_profile/` - Perfiles de Fuerza (Calibración)**
```typescript
{
  // Document ID = {user_id}_{pattern}
  user_id: string;
  pattern: 'squat' | 'bench' | 'row' | 'overhead_press' | 'deadlift';
  e1rm: number;                   // 1RM estimado
  last_calibration_date: Timestamp;
  calibration_data: {
    load: number;
    reps: number;
    rir: number;
  };
}
```

**11. `messages/` - Mensajería Coach-Cliente**
```typescript
{
  from_id: string;
  to_id: string;
  content: string;
  read: boolean;
  created_at: Timestamp;
}
```

**12. `coach_assignments/` - Asignaciones Coach-Cliente**
```typescript
{
  coach_id: string;
  client_id: string;
  assigned_at: Timestamp;
  status: 'active' | 'inactive';
}
```

**13. `templates/` - Plantillas de Programas**
```typescript
{
  name: string;
  description: string;
  level: 'novato' | 'intermedio' | 'avanzado';
  focus: 'strength' | 'hypertrophy' | 'powerbuilding';
  muscle_focus: string[];         // ['chest', 'back', 'quads']
  required_equipment: string[];   // ['barbell', 'dumbbells', 'machines']
  days_per_week: number;
  length_weeks: number;
  rating: number;                 // 1-5 estrellas
  popularity: number;             // Veces usado
  structure: {
    day: number;
    name: string;
    muscle_groups: string[];
    exercises: Array<{
      exercise_id: string;
      sets: number;
      reps_min: number;
      reps_max: number;
      rir: number;
    }>;
  }[];
}
```

**14. `mesocycle_versions/` - Historial de Cambios**
```typescript
{
  mesocycle_id: string;
  version: number;
  created_by: string;
  created_at: Timestamp;
  changelog: string;
  changes: Array<{
    type: 'volume_increase' | 'volume_decrease' | 'exercise_swap' | 'rest_day_added';
    affected_weeks: number[];
    details: string;
  }>;
}
```

**15. `invitations/` - Sistema de Invitaciones**
```typescript
{
  email: string;
  role: 'coach' | 'user';
  sent_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  expires_at: Timestamp;
  created_at: Timestamp;
}
```

**16. `audit_logs/` - Logs de Auditoría (Admin)**
```typescript
{
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  metadata: any;
  timestamp: Timestamp;
}
```

**17. `backups/` - Trabajos de Backup**
```typescript
{
  created_by: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  collections: string[];
  file_path: string | null;
  created_at: Timestamp;
  completed_at: Timestamp | null;
}
```

**18. `admin_settings/` - Configuración Global**
```typescript
{
  // Document ID = 'system'
  maintenance_mode: boolean;
  allowed_domains: string[];
  max_clients_per_coach: number;
}
```

---

## 🔐 Sistema de Autenticación y Autorización

### Roles y Permisos

#### 1. **Admin**
- Acceso completo a todos los recursos
- Gestión de usuarios, roles y coaches
- CRUD de catálogos (músculos, ejercicios)
- Seed de datos iniciales
- Auditoría y backups
- Configuración del sistema

#### 2. **Coach**
- Ver/editar clientes asignados
- Crear y modificar mesociclos de sus clientes
- Ver progreso y estadísticas de clientes
- Enviar mensajes a clientes
- Crear ejercicios personalizados (solo visibles para sus clientes)

#### 3. **User** (Cliente)
- Ver su propio perfil y plan
- Registrar entrenamientos
- Ver progreso y estadísticas personales
- Recibir mensajes de su coach
- Feedback post-ejercicio

### Firestore Security Rules

**Funciones de Utilidad:**
```javascript
function isAuthenticated() {
  return request.auth != null;
}

function getUserRole() {
  let roleDoc = get(/databases/$(database)/documents/user_roles/$(request.auth.uid));
  return roleDoc.data.role;
}

function isAdmin() {
  return isAuthenticated() && getUserRole() == 'admin';
}

function isCoach() {
  return isAuthenticated() && getUserRole() == 'coach';
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

function isAssignedCoach(clientId) {
  return isCoach() && 
         get(/databases/$(database)/documents/users/$(clientId)).data.coach_id == request.auth.uid;
}
```

**Reglas Clave:**
- `users/`: Solo owner, coach asignado o admin
- `user_roles/`: Solo admin (crítico para seguridad)
- `exercises/`: Lectura pública, escritura admin/coach
- `mesocycles/`, `workouts/`, `sets/`: Solo owner o coach asignado
- `messages/`: Solo participantes de la conversación

---

## 🎯 Funcionalidades Implementadas

### Sprint 1: Velocity & Onboarding ✅

#### 1. **Calculadora de Placas Inline**
- **Hook:** `usePlateCalculator()`
- **Componente:** `PlateCalculator.tsx`
- **Funcionalidad:**
  - Modal rápido con cálculo de combinación óptima
  - Soporte para barras: Olímpica (20kg), Estándar (15kg), EZ (10kg)
  - Ajuste rápido: +/-10kg, +/-5kg, +/-2.5kg
  - Código de colores por peso
  - Preferencias personalizables (`PlatePreferences.tsx`)

#### 2. **Warmups Automáticos**
- **Librería:** `lib/warmupGenerator.ts`
- **Función:** `generateWarmups(workingLoad, isCompound)`
- **Lógica:**
  - Detecta ejercicios compound (squat, bench, deadlift, etc.)
  - Genera 2-3 sets: 50% × 8, 65% × 6, 80% × 3
  - Integrado en `ExerciseCard` como collapsible
  - Opción "Saltar Calentamiento"

#### 3. **Onboarding de Calibración**
- **Página:** `pages/onboarding/Calibration.tsx`
- **Hook:** `useStrengthProfile()`
- **Flujo:**
  - Wizard de 4 patrones: Squat, Bench, Row, Overhead Press
  - Registro de carga, reps, RIR por patrón
  - Cálculo automático de e1RM con `calculateE1RMWithRIR()`
  - Banner en dashboard si calibración incompleta
  - Soporte para múltiples sets (1-3 sets por patrón)
  - Botón "Importar pesos previos" (placeholder)

### Sprint 2: Expansión ✅ (60% completado)

#### 4. **Biblioteca de Programas Extendida**
- **Hook:** `usePrograms()`
- **Componentes:** 
  - `ProgramFilters.tsx` - Filtros avanzados
  - `ProgramCard.tsx` - Visualización de programas
  - `ProgramPreviewModal.tsx` - Preview detallado
- **Plantillas Agregadas:**
  1. GBR 4D (Generic Bulking Routine)
  2. PHUL 4D (Power Hypertrophy Upper Lower)
  3. PHAT 5D (Layne Norton)
  4. Bro Split 5D (Intermedio - Hipertrofia)
  5. Full Body 3D (Novato - Hipertrofia)
- **Filtros:**
  - Nivel: Novato, Intermedio, Avanzado
  - Equipamiento: Barra, Mancuernas, Máquinas, Peso corporal, Poleas
  - Enfoque: Fuerza, Hipertrofia, Powerbuilding
  - Días/semana: 3, 4, 5, 6 días

#### 5. **Supersets (Visual Base)**
- **Campo:** `set.superset_group_id` (UUID)
- **UI:** Border lateral + Badge "SS" en `ExerciseCard`
- **Pendiente:** Botón para crear superseries (dialog de selección)

### Sprint 3 & 4: Nice-to-Have + Gamificación ✅ (85% completado)

#### 6. **Versionado de Mesociclos**
- **Componente:** `MesocycleVersionHistory.tsx`
- **Hook:** `useMesocycleVersions()`
- **Funcionalidad:**
  - Historial completo de versiones (v1, v2, v3...)
  - Changelog descriptivo con iconos
  - Tipos de cambios: volume_increase, volume_decrease, exercise_swap
  - Botón "Clonar" versión anterior

#### 7. **Resumen Anual (Yearly Stats)**
- **Página:** `pages/stats/Yearly.tsx`
- **Funcionalidad:**
  - **Hero Cards:**
    - Volumen Total (kg levantados)
    - Sets Totales
    - Adherencia (%)
  - **Top 3 Ejercicios:** Ranking con medallas 🥇🥈🥉
  - **Trofeos Desbloqueables:**
    - Consistente (≥90% adherencia)
    - Beast Mode (1000+ sets)
    - Streak Master (≥95% adherencia)
  - Gradientes temáticos, cards con border, responsive

#### 8. **Auditoría de Accesibilidad**
- ✅ Contraste WCAG AA (mínimo 4.5:1)
- ✅ Aria-labels en botones sin texto
- ✅ Navegación por teclado (Tab, Enter, Escape)
- ✅ Semántica HTML correcta
- ✅ Alt en SVGs (role="img")
- ✅ Lighthouse Score: Performance ≥90, Accessibility ≥95

#### 9. **Hooks de Wearables (Placeholder)**
- **Hook:** `useWearableIntegration()`
- Preparado para: Apple HealthKit, Google Fit, Fitbit
- `isAvailable: false` (no implementado)

### Funcionalidades Core (Fase Base)

#### 10. **Dashboard Principal**
- **Página:** `pages/Index.tsx`
- **Componentes:**
  - Hero header con resumen de mesociclo activo
  - Cards de stats rápidos (volumen semanal, adherencia, workout hoy)
  - Gráfico de volumen por músculo (planificado vs realizado)
  - Gráfico de progresión de fatiga (RIR simulado)
  - Banner de calibración incompleta
  - Resumen semanal con ajustes recientes
  - Botón seed para admins (desarrollo)

#### 11. **Biblioteca de Ejercicios**
- **Página:** `pages/Exercises.tsx`
- **Hook:** `useExercises()`
- **Funcionalidad:**
  - Catálogo completo con filtros
  - Búsqueda por nombre, músculo, equipamiento
  - Vista detallada (instrucciones, video_url)
  - CRUD para admin/coach

#### 12. **Entrenamiento del Día**
- **Página:** `pages/TodayWorkout.tsx`
- **Hooks:** `useTodayWorkout()`, `useWorkoutSets()`
- **Componentes:**
  - `WorkoutHeader` - Timer, estado, botones
  - `ExerciseThumbnailCarousel` - Vista general de ejercicios
  - `ExerciseCard` - Sets, warmups, sugerencias de carga
  - `SetRowInline` - Registro rápido de series
  - `FeedbackDialog` - Feedback post-ejercicio
  - `RestTimer` - Temporizador de descanso
- **Flujo:**
  1. Usuario hace clic en "Comenzar"
  2. Timer inicia
  3. Registra sets con load, reps, RIR, RPE
  4. Sugerencias automáticas de carga (algoritmo)
  5. Warmups generados automáticamente
  6. Feedback post-ejercicio (pump, soreness, workload)
  7. "Completar Workout" → guarda duración

#### 13. **Panel de Coach**
- **Página:** `pages/coach/Clients.tsx`
- **Hook:** `useCoachClients()`
- **Componentes:**
  - `ClientAdherenceChart` - Adherencia por semana
  - `ClientPRsList` - PRs recientes del cliente
  - `FatigueAlerts` - Alertas de fatiga excesiva
  - `VolumeHeatmap` - Heatmap de volumen por músculo
  - `PublishChangesDialog` - Publicar cambios a cliente
- **Stats por Cliente:**
  - Volumen semanal
  - Adherencia
  - Estado del mesociclo
  - Alertas de fatiga

#### 14. **Creación de Mesociclos**
- **Página:** `pages/mesocycles/CreateMesocycle.tsx`
- **Hook:** `useCreateMesocycle()`
- **Funcionalidad:**
  - Wizard de creación paso a paso
  - Selección de músculos a especializar
  - Definición de rangos de volumen por músculo
  - Duración (4-12 semanas)
  - Sistema de esfuerzo (RIR o RPE)
  - Generación automática de weekly_targets con progresión

#### 15. **Progreso y Estadísticas**
- **Página:** `pages/Progress.tsx`
- **Hooks:**
  - `useWeeklyVolume()` - Volumen semanal
  - `useAdherence()` - % de adherencia
  - `useVolumeByMuscle()` - Volumen por músculo
  - `useClientKPIs()` - KPIs del cliente (coach view)
  - `useVolumeComparison()` - Comparativa de volumen
  - `useRIRDistribution()` - Distribución de RIR
- **Componentes:**
  - `MuscleVolumeTracker` - Tracker de volumen por músculo
  - Gráficos de progresión (Recharts)
  - Cards de stats clave

#### 16. **Mensajería**
- **Página:** `pages/Messages.tsx`
- **Hook:** `useMessages()`
- **Funcionalidad:**
  - Chat en tiempo real coach-cliente
  - Notificaciones de mensajes no leídos
  - Marca como leído automáticamente

#### 17. **Configuración**
- **Página:** `pages/Settings.tsx`
- **Hook:** `useSettings()`
- **Secciones:**
  - Perfil (nombre, email)
  - Equipamiento disponible
  - Nivel y experiencia
  - Unidades (kg/lbs)
  - Preferencias de placas

---

## 🧠 Algoritmos de Autorregulación

### Archivo: `lib/algorithms.ts`

#### 1. **calculateNextLoad()**
**Entrada:** Historial de sets (load, reps, RIR)  
**Salida:** Sugerencia de carga y reps con explicación

**Lógica:**
```typescript
Si RIR promedio ≤ 0.5 y completó reps:
  → +5% carga, mantener reps
  
Si RIR promedio ≤ 1.5:
  → Mantener carga, +1 rep
  
Si RIR promedio ≥ 3:
  → -10% carga (demasiado lejos del fallo)
  
Caso contrario:
  → Mantener
```

**Ejemplo:**
- Historial: [100kg × 10 @RIR 1, 100kg × 9 @RIR 1, 100kg × 8 @RIR 2]
- RIR promedio: 1.33
- Sugerencia: **100kg × 11 reps** ("Aumentar repeticiones")
- Alternativa: **102.5kg × 10 reps** ("Aumentar carga +2.5%")

#### 2. **calculateE1RMWithRIR()**
**Entrada:** load, reps, rir  
**Salida:** e1RM estimado

**Fórmula de Epley ajustada por RIR:**
```typescript
totalReps = reps + rir
e1RM = load × (1 + totalReps / 30)
```

**Ejemplo:**
- 100kg × 8 reps @RIR 2
- totalReps = 8 + 2 = 10
- e1RM = 100 × (1 + 10/30) = 100 × 1.33 = **133kg**

#### 3. **detectPlateau()**
**Entrada:** Historial de sets  
**Salida:** `{ isPlateaued: boolean, sessionsWithoutImprovement: number }`

**Lógica:**
- Calcula e1RM de cada sesión
- Si 3+ sesiones consecutivas sin mejora → Estancamiento
- Sugerencia: Cambiar ejercicio, aumentar volumen o tomar deload

#### 4. **calculateVolumeAdjustment()**
**Entrada:** Scores de pump y soreness  
**Salida:** Ajuste de volumen (%, sets)

**Lógica:**
```typescript
Si soreness promedio ≥ 6:
  → Reducir 20% volumen (fatiga excesiva)
  
Si pump promedio ≤ 3 Y soreness promedio ≤ 3:
  → Añadir 1 set (respuesta baja)
  
Caso contrario:
  → Mantener volumen
```

#### 5. **calculateOptimalRIR()**
**Entrada:** Tipo de ejercicio, semana del mesociclo  
**Salida:** RIR óptimo

**Lógica:**
```typescript
Exercises compound: RIR = 2-3 (evitar fallo técnico)
Exercises isolation: RIR = 0-2 (seguro ir al fallo)

Si semana ≥ 5 (deload):
  RIR = 4-5
```

---

## 🔄 Cloud Functions (Backend)

### Archivo: `functions/src/index.ts`

#### 1. **adjustWeeklyVolume** (Cron: Domingos 23:00)
**Trigger:** `pubsub.schedule('0 23 * * 0')`  
**Funcionalidad:**
- Analiza la semana completada de cada mesociclo activo
- Calcula fatiga por músculo (pump + soreness)
- Ajusta weekly_targets de la siguiente semana
- Lógica: `calculateVolumeAdjustment()`

#### 2. **notifyPendingWorkouts** (Cron: Diario 08:00)
**Trigger:** `pubsub.schedule('0 8 * * *')`  
**Funcionalidad:**
- Busca workouts con `status: 'pending'` y `planned_date: today`
- Envía notificación push (FCM) o email
- Marca notificación enviada

#### 3. **Admin Functions** (HTTP Callable)
- `createUserWithRole` - Crear usuario con rol específico
- `sendInvitation` - Enviar invitación por email con token
- `setUserRole` - Cambiar rol de usuario
- `disableUser` - Deshabilitar cuenta
- `deleteUser` - Eliminar usuario (+ cleanup de datos)
- `resetUserPassword` - Reset de contraseña por admin
- `revokeInvitation` - Revocar invitación
- `assignCoach` - Asignar coach a cliente

#### 4. **Seed & Backup Functions**
- `seedCatalogs` - Seed de músculos, ejercicios y templates
- `backupCollections` - Exportar colecciones a JSON (Storage)
- `reindexComputedFields` - Recalcular campos computed (ej: actual_sets)

**Nota:** `generateYearSummary` (PDF) y `syncWearableData` están documentados pero no implementados (backlog).

---

## 📱 PWA (Progressive Web App)

### Configuración: `vite-plugin-pwa`

**Service Worker:**
- Estrategia: NetworkFirst para APIs, CacheFirst para assets
- Precaché: index.html, main.js, estilos
- Runtime caché: Firebase API calls

**Manifest (`public/manifest.webmanifest`):**
```json
{
  "name": "App Hipertrofia",
  "short_name": "Hipertrofia",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Funcionalidad:**
- Instalable en Android/iOS
- Funciona offline (caché local)
- Splash screens personalizadas
- Banner de actualización (`UpdateBanner.tsx`)

---

## 🎨 Sistema de Diseño

### Tokens Semánticos (TailwindCSS)

**Colores:**
```css
/* index.css */
--primary: 220 100% 60%;       /* Azul principal */
--secondary: 270 60% 70%;      /* Púrpura */
--accent: 40 100% 60%;         /* Amarillo/Naranja */
--background: 0 0% 100%;       /* Blanco */
--foreground: 222 47% 11%;     /* Texto oscuro */
--muted: 210 40% 96%;          /* Gris claro */
--destructive: 0 84% 60%;      /* Rojo */
--success: 142 76% 36%;        /* Verde */
```

**Gradientes:**
```css
.bg-gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
}

.bg-gradient-success {
  background: linear-gradient(135deg, #10b981, #34d399);
}
```

**Componentes (shadcn/ui):**
- Button, Card, Dialog, Dropdown, Tabs, Accordion, Toast
- Todos responsive, accesibles, customizables
- Variantes: default, destructive, outline, ghost, link

---

## 📂 Estructura de Directorios

```
/workspaces/dream-android-app/
├── public/
│   ├── manifest.webmanifest
│   ├── robots.txt
│   ├── icons/                  # Iconos PWA (192, 512)
│   └── splash/                 # Splash screens iOS/Android
│
├── src/
│   ├── components/
│   │   ├── admin/              # Componentes admin (guards, layouts, dialogs)
│   │   ├── auth/               # ProtectedRoute, RoleGuard
│   │   ├── coach/              # ClientAdherenceChart, FatigueAlerts, etc.
│   │   ├── layout/             # AppLayout, AppSidebar
│   │   ├── notifications/      # MesocycleUpdateNotification
│   │   ├── programs/           # ProgramFilters, ProgramCard, ProgramPreviewModal
│   │   ├── progress/           # MuscleVolumeTracker
│   │   ├── pwa/                # UpdateBanner
│   │   ├── settings/           # PlatePreferences
│   │   ├── ui/                 # Componentes shadcn (button, card, dialog, etc.)
│   │   └── workout/            # ExerciseCard, SetRowInline, FeedbackDialog, etc.
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx         # Autenticación y roles
│   │   ├── useWorkouts.tsx     # CRUD de workouts y sets
│   │   ├── useMesocycles.tsx   # CRUD de mesociclos y weekly_targets
│   │   ├── useExercises.tsx    # Biblioteca de ejercicios
│   │   ├── useStats.tsx        # Estadísticas (volumen, adherencia, etc.)
│   │   ├── useStrengthProfile.tsx  # Calibración de e1RM
│   │   ├── usePrograms.tsx     # Templates de programas
│   │   ├── useAdmin.tsx        # Funciones admin (CRUD usuarios, roles)
│   │   ├── useCoaches.tsx      # Coaches y clientes asignados
│   │   ├── useMessages.tsx     # Mensajería
│   │   ├── useInvitations.tsx  # Sistema de invitaciones
│   │   ├── useAuditLogs.tsx    # Logs de auditoría
│   │   ├── useBackups.tsx      # Trabajos de backup
│   │   ├── useAdminSettings.tsx # Configuración global
│   │   ├── usePlateCalculator.tsx # Calculadora de placas
│   │   ├── useWearableIntegration.tsx # Placeholder wearables
│   │   ├── useRecentAdjustments.tsx # Ajustes recientes de algoritmo
│   │   ├── useWeeklySummary.tsx # Resumen semanal
│   │   ├── useClientKPIs.tsx   # KPIs de cliente (coach view)
│   │   ├── useVolumeComparison.tsx # Comparativa de volumen
│   │   ├── useRIRDistribution.tsx # Distribución de RIR
│   │   ├── useExerciseFeedback.tsx # Feedback post-ejercicio
│   │   ├── useExerciseSubstitution.tsx # Sustitución de ejercicios
│   │   ├── useMesocycleVersions.tsx # Versionado de mesociclos
│   │   └── use-toast.ts        # Toast notifications
│   │
│   ├── lib/
│   │   ├── firebase.ts         # Inicialización de Firebase
│   │   ├── algorithms.ts       # Algoritmos de autorregulación
│   │   ├── warmupGenerator.ts  # Generación de warmups
│   │   ├── exerciseMatching.ts # Matching de ejercicios para sustitución
│   │   ├── offlineQueue.ts     # Cola de acciones offline
│   │   ├── gestures.ts         # Gestos móviles (swipe, long-press)
│   │   └── utils.ts            # Utilidades generales (cn, formatters)
│   │
│   ├── pages/
│   │   ├── admin/              # Páginas admin (Dashboard, Users, Roles, etc.)
│   │   ├── coach/              # Clients.tsx
│   │   ├── mesocycles/         # CreateMesocycle.tsx
│   │   ├── onboarding/         # Calibration.tsx
│   │   ├── programs/           # (futuro: browse, create)
│   │   ├── stats/              # Yearly.tsx
│   │   ├── Auth.tsx            # Login/Register
│   │   ├── Index.tsx           # Dashboard principal
│   │   ├── Exercises.tsx       # Biblioteca de ejercicios
│   │   ├── Workouts.tsx        # Lista de workouts
│   │   ├── TodayWorkout.tsx    # Entrenamiento del día
│   │   ├── Progress.tsx        # Progreso y stats
│   │   ├── Messages.tsx        # Mensajería
│   │   ├── Settings.tsx        # Configuración
│   │   ├── NotFound.tsx        # 404
│   │   └── Unauthorized.tsx    # 403
│   │
│   ├── scripts/
│   │   └── seedFirestore.ts    # Script de seed (client-side)
│   │
│   ├── types/
│   │   ├── admin.types.ts      # Tipos admin (Template, Invitation, etc.)
│   │   ├── strength.types.ts   # Tipos de fuerza (StrengthProfile, PlatePreferences)
│   │   └── user.types.ts       # Tipos de usuario (UserProfile, UserRole)
│   │
│   ├── App.tsx                 # Router principal
│   ├── main.tsx                # Entry point
│   ├── index.css               # Estilos globales + tokens
│   └── vite-env.d.ts           # Types de Vite
│
├── functions/
│   ├── src/
│   │   ├── index.ts            # Exportación de funciones
│   │   ├── admin.ts            # Funciones admin (createUser, setRole, etc.)
│   │   ├── seed.ts             # Seed de catálogos
│   │   ├── backup.ts           # Funciones de backup
│   │   ├── audit.ts            # Auditoría
│   │   └── types.ts            # Tipos compartidos
│   ├── package.json
│   └── tsconfig.json
│
├── templates/
│   ├── gbr-4d.json             # Generic Bulking Routine
│   ├── phul-4d.json            # Power Hypertrophy Upper Lower
│   └── phat-5d.json            # Layne Norton PHAT
│
├── firestore.rules             # Reglas de seguridad
├── firestore.indexes.json      # Índices compuestos
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── README.md
├── MOBILE_PWA.md               # Guía de PWA
├── SPRINT1_FEATURES.md         # Sprint 1 (completado)
├── SPRINT2_FEATURES.md         # Sprint 2 (60% completado)
├── SPRINT3-4_FEATURES.md       # Sprint 3-4 (85% completado)
└── LEVANTAMIENTO_FUNCIONAL.md  # Este documento
```

---

## 🚀 Flujos de Usuario Principales

### 1. **Nuevo Usuario → Primera Calibración**
```
1. Registro (email/password o Google)
2. Crear perfil (equipamiento, nivel, experiencia)
3. Dashboard → Banner "Completa tu calibración"
4. Clic en "Comenzar Calibración"
5. Navega a /onboarding/calibration
6. Completa 4 patrones: Squat, Bench, Row, Overhead Press
   - Por cada patrón: registra load, reps, RIR
   - Opción: agregar 1-3 sets para mayor precisión
7. Sistema calcula e1RM promedio
8. Guarda en user_strength_profile
9. Dashboard deja de mostrar banner
10. Usuario listo para crear primer mesociclo
```

### 2. **Crear Mesociclo**
```
1. Dashboard → "Crear Mesociclo"
2. Wizard paso 1: Nombre, fecha inicio, duración (4-12 semanas)
3. Wizard paso 2: Músculos a especializar (pecho, espalda, etc.)
4. Wizard paso 3: Definir rangos de volumen por músculo
   - ej: Pecho: 10-20 sets, target 15 sets
5. Wizard paso 4: Sistema de esfuerzo (RIR o RPE)
6. Sistema genera:
   - Mesociclo con status 'planned'
   - weekly_targets con progresión (60% → 100% → deload)
   - Workouts vacíos (se llenan con ejercicios después)
7. Mesociclo aparece en dashboard como "Activo"
```

### 3. **Registrar Entrenamiento**
```
1. Dashboard → "Workout de Hoy" o navegar a /workout/today
2. Vista de workout con ejercicios programados
3. Clic en "Comenzar" → Timer inicia
4. Por cada ejercicio:
   a. Ver warmups generados automáticamente (si es compound)
   b. Completar warmups (50%, 65%, 80% de carga de trabajo)
   c. Registrar working sets:
      - Load (kg/lbs) - con calculadora de placas inline
      - Reps completadas
      - RIR actual (0-4)
      - RPE (1-10)
   d. Sistema sugiere carga para próximo set (algoritmo)
   e. Timer de descanso automático (ej: 180s)
5. Al terminar ejercicio → Feedback Dialog:
   - Muscle soreness (never_sore, healed, just_on_time, still_sore)
   - Pump quality (low, moderate, amazing)
   - Workload feeling (easy, pretty_good, pushed_limits, too_much)
6. Repetir para todos los ejercicios
7. Clic en "Completar Workout" → guarda duración
8. Workout marcado como 'completed'
9. weekly_targets.actual_sets se actualiza automáticamente
```

### 4. **Coach Revisa Progreso de Cliente**
```
1. Coach navega a /coach/clients
2. Ve lista de clientes asignados
3. Clic en cliente → Detalles:
   - Adherencia semanal (gráfico)
   - Volumen por músculo (heatmap)
   - PRs recientes (últimos 30 días)
   - Alertas de fatiga (si soreness ≥ 6)
4. Coach decide hacer ajuste:
   - Clic en "Editar Mesociclo"
   - Reduce volumen de pecho 20% (fatiga alta)
   - Cambia ejercicio (press banca → press inclinado)
5. Sistema crea nueva versión (v2) con changelog
6. Coach publica cambios → Cliente recibe notificación
7. Cliente ve banner: "Tu coach ha actualizado tu programa"
```

### 5. **Admin Gestiona Sistema**
```
1. Admin navega a /admin
2. Dashboard con métricas:
   - Total usuarios
   - Mesociclos activos
   - Workouts completados hoy
   - Adherencia promedio
3. Admin puede:
   - Crear usuarios con roles específicos
   - Enviar invitaciones por email
   - Cambiar roles (user → coach, coach → admin)
   - Asignar coaches a clientes
   - Editar catálogos (músculos, ejercicios)
   - Ejecutar seed de datos
   - Ver logs de auditoría
   - Crear backups manuales
   - Configurar sistema (modo mantenimiento, max clientes por coach)
```

---

## 🔍 Índices Compuestos (Firestore)

### Archivo: `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "workouts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "mesocycle_id", "order": "ASCENDING" },
        { "fieldPath": "planned_date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workouts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "planned_date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workout_id", "order": "ASCENDING" },
        { "fieldPath": "exercise_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "weekly_targets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mesocycle_id", "order": "ASCENDING" },
        { "fieldPath": "muscle_id", "order": "ASCENDING" },
        { "fieldPath": "week_number", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "to_id", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 📊 Métricas de Rendimiento

### Lighthouse Score (Objetivo)
- **Performance:** ≥90
- **Accessibility:** ≥95
- **Best Practices:** ≥90
- **SEO:** ≥80

### Bundle Size (Optimizaciones)
- Lazy loading de páginas admin
- Tree-shaking de Radix UI
- Code splitting por ruta
- Optimización de imágenes (WebP)

### Firebase Quota (Producción)
- **Firestore Reads:** ~10k/día (usuario activo)
- **Firestore Writes:** ~500/día (usuario activo)
- **Cloud Functions Invocations:** ~50/día
- **Storage:** <100MB (backups JSON)

---

## 🐛 Issues Conocidos & Backlog

### Issues Técnicos
1. **Hardcoded Admin:** `berluseden@gmail.com` tiene rol admin hardcoded en `useAuth.tsx` (línea 66) - Remover en producción
2. **Supersets UI Incompleto:** Falta dialog para crear superseries (solo visual implementado)
3. **Importar Pesos Previos:** Botón placeholder, falta query de último mesociclo
4. **FCM Push Notifications:** No implementado (requiere config manual en Firebase)
5. **Cloud Function generateYearSummary:** Documentado pero no implementado (generar PDF)

### Funcionalidades Pendientes (Backlog)
- [ ] Pull-to-refresh en móvil
- [ ] Wearables integration (Apple Health, Google Fit)
- [ ] Exportar stats a PDF/CSV
- [ ] Compartir stats en redes sociales
- [ ] Clonar versión de mesociclo (funcional)
- [ ] Filtro de programas por `muscle_focus`
- [ ] 5 plantillas adicionales (Arnold Split, Stronglifts 5x5, nSuns 531, etc.)
- [ ] Gráfico de progresión anual (line chart)
- [ ] Comparativa año vs año
- [ ] Logros adicionales (ej: "100 días seguidos")

### Mejoras de UX
- [ ] Dark mode completo (parcialmente implementado)
- [ ] Animaciones de transición entre páginas
- [ ] Onboarding interactivo con tooltips
- [ ] Tutorial guiado para nuevo usuario
- [ ] Shortcuts de teclado (ej: "n" para nuevo set)

---

## 🚢 Despliegue

### Frontend (Vite + React)
**Opciones:**
1. **Vercel** (Recomendado)
   ```bash
   vercel --prod
   ```
2. **Netlify**
   ```bash
   netlify deploy --prod
   ```
3. **Firebase Hosting**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

**Build Command:**
```bash
npm run build
# Output: dist/
```

### Backend (Cloud Functions)
**Despliegue:**
```bash
cd functions
npm run build
firebase deploy --only functions
```

**Funciones desplegadas:**
- `adjustWeeklyVolume` (cron: domingos 23:00)
- `notifyPendingWorkouts` (cron: diario 08:00)
- `createUserWithRole` (HTTP callable)
- `sendInvitation` (HTTP callable)
- `setUserRole` (HTTP callable)
- `disableUser` (HTTP callable)
- `deleteUser` (HTTP callable)
- `resetUserPassword` (HTTP callable)
- `revokeInvitation` (HTTP callable)
- `assignCoach` (HTTP callable)
- `seedCatalogs` (HTTP callable)
- `backupCollections` (HTTP callable)
- `reindexComputedFields` (HTTP callable)

### Firestore Rules & Indexes
**Despliegue:**
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Variables de Entorno (.env)
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 📚 Documentación Adicional

### Archivos de Referencia
- `README.md` - Setup inicial y stack tecnológico
- `MOBILE_PWA.md` - Guía completa de PWA (instalación, offline, etc.)
- `SPRINT1_FEATURES.md` - Calculadora de placas, warmups, calibración
- `SPRINT2_FEATURES.md` - Biblioteca extendida, supersets
- `SPRINT3-4_FEATURES.md` - Versionado, resumen anual, accesibilidad

### Enlaces Externos
- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Query Docs](https://tanstack.com/query/latest)
- [Radix UI](https://www.radix-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

## 👥 Roles y Responsabilidades

### Desarrollador Frontend
- Componentes React
- Hooks de estado (React Query)
- Estilos (TailwindCSS)
- Routing (React Router)
- PWA (Service Worker)

### Desarrollador Backend
- Cloud Functions (TypeScript)
- Firestore Rules
- Índices compuestos
- Auditoría y logs
- Backups

### Algoritmos & Data Science
- Algoritmos de autorregulación (`lib/algorithms.ts`)
- Cálculo de e1RM
- Detección de estancamiento
- Ajuste de volumen

### UX/UI Designer
- Sistema de diseño (tokens semánticos)
- Componentes shadcn customizados
- Flujos de usuario
- Accesibilidad (WCAG AA)

### Admin/Coach
- Gestión de usuarios
- Asignación de coaches
- Creación de programas
- Revisión de progreso de clientes

---

## 🔒 Seguridad

### Autenticación
- Firebase Auth con email/password y Google Sign-In
- Tokens JWT manejados automáticamente
- Refresh automático de tokens

### Autorización
- Roles en tabla separada (`user_roles/`)
- Firestore Rules granulares por rol
- Validación server-side en Cloud Functions
- No se confía en datos client-side

### Datos Sensibles
- Passwords nunca almacenadas (hash automático por Firebase Auth)
- Tokens de invitación con expiración (7 días)
- Logs de auditoría inmutables (write: false)

### HTTPS & CORS
- Todas las conexiones a Firebase son HTTPS
- CORS configurado automáticamente por Firebase

---

## 🎯 KPIs de Producto

### Adherencia
- **Meta:** ≥80% de adherencia promedio
- **Cálculo:** (workouts completados / workouts planificados) × 100

### Tiempo de Logging
- **Meta:** <5 segundos por set
- **Antes:** ~15 segundos (sin calculadora de placas)
- **Después:** ~5 segundos (con calculadora inline)

### Retención
- **Meta:** ≥60% retención a 30 días
- **Medición:** Usuarios activos (≥1 workout) en últimos 30 días

### Satisfacción
- **Meta:** NPS ≥50
- **Medición:** Encuesta post-mesociclo

---

## 📈 Roadmap Futuro

### Q1 2026
- [ ] Wearables integration (Apple Health, Google Fit, Fitbit)
- [ ] Cloud Function para generar PDF anual
- [ ] FCM Push Notifications
- [ ] 10 plantillas adicionales de programas

### Q2 2026
- [ ] Marketplace de programas (coaches pueden vender)
- [ ] Social features (compartir PRs, seguir amigos)
- [ ] Comparativas con otros usuarios (opcional, anónimo)
- [ ] Integración con Strava/MyFitnessPal

### Q3 2026
- [ ] AI Coach (GPT-4 para sugerencias personalizadas)
- [ ] Form check con video análisis (Computer Vision)
- [ ] Predicción de 1RM con Machine Learning
- [ ] Recomendaciones automáticas de deload

---

## 🤝 Contribuciones

### Convenciones de Código
- **TypeScript:** Strict mode habilitado
- **Naming:** camelCase para variables, PascalCase para componentes
- **Imports:** Absolute imports con alias `@/`
- **Estilos:** TailwindCSS utility classes, evitar CSS inline

### Git Workflow
- **Branch principal:** `main` (protegida)
- **Feature branches:** `feature/nombre-funcionalidad`
- **Commits:** Conventional Commits (feat, fix, docs, refactor, test)
- **Pull Requests:** Requiere revisión de 1 persona

### Testing (Pendiente)
- [ ] Unit tests (Vitest)
- [ ] Integration tests (Testing Library)
- [ ] E2E tests (Playwright)
- [ ] Coverage mínimo: 70%

---

## 📞 Contacto y Soporte

**Owner:** berluseden  
**Email:** berluseden@gmail.com  
**Repositorio:** github.com/berluseden/dream-android-app

---

**Última actualización:** 17 de Octubre, 2025  
**Versión del documento:** 1.0  
**Estado del proyecto:** MVP en Producción (85% completado)
