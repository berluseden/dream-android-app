# Sprint 2: Expansión - Implementación Completada ✅

## Funcionalidades Implementadas

### 1. 📚 Biblioteca de Programas Extendida

**Ubicación:** `functions/src/seed.ts`, `src/hooks/usePrograms.tsx`, `src/components/programs/ProgramFilters.tsx`

**Características:**

#### **Schema Extendido de Templates:**
```typescript
interface Template {
  // Campos existentes...
  level?: 'novato' | 'intermedio' | 'avanzado';
  muscle_focus?: string[]; // ['chest', 'back', 'quads']
  required_equipment?: string[]; // ['barbell', 'dumbbells', 'machines']
  focus?: 'strength' | 'hypertrophy' | 'powerbuilding';
}
```

#### **Nuevas Plantillas Agregadas:**

1. **Bro Split 5D** (Intermedio - Hipertrofia)
   - Enfoque: Pecho, Espalda, Hombros, Piernas, Brazos
   - Equipamiento: Barra, Mancuernas, Máquinas
   - 5 días/semana, 6 semanas
   - 10-25 sets por grupo muscular

2. **Full Body 3D** (Novato - Hipertrofia)
   - Enfoque: Todos los grupos musculares 3x/semana
   - Equipamiento: Barra, Mancuernas
   - 3 días/semana, 6 semanas
   - 6-15 sets por sesión
   - Ideal para principiantes

3. **Plantillas existentes actualizadas:**
   - GBR 4D (Generic Bulking Routine)
   - PHUL 4D (Power Hypertrophy Upper Lower)
   - PHAT 5D (Layne Norton)

**Total de plantillas:** 5 plantillas (objetivo: agregar 5 más en futuras iteraciones)

---

#### **Filtros Mejorados:**

**Archivo:** `src/components/programs/ProgramFilters.tsx`

**Nuevos filtros disponibles:**
- **Nivel:** Novato, Intermedio, Avanzado
- **Equipamiento:** Barra, Mancuernas, Máquinas, Peso corporal, Poleas
- **Enfoque:** Fuerza, Hipertrofia, Powerbuilding
- **Días/semana:** 3, 4, 5, 6 días

**Filtrado en memoria:**
- Los programas se filtran client-side para evitar índices compuestos complejos en Firestore
- Ordenamiento por rating y popularidad

---

### 2. 💪 Supersets (Funcionalidad Base)

**Ubicación:** `src/hooks/useWorkouts.tsx`, `src/components/workout/ExerciseCard.tsx`

**Características:**

#### **Schema Firestore:**
```typescript
interface Set {
  // Campos existentes...
  superset_group_id?: string; // UUID para agrupar sets en superseries
}
```

#### **UI Visual en ExerciseCard:**
- **Border lateral izquierdo** con color primario para sets en superseries
- **Badge "SS"** junto al número de set
- **Background** con tinte primary/5 para destacar
- Agrupación automática de sets con mismo `superset_group_id`

**Ejemplo visual:**
```
┌─────────────────────────────┐
│ Press Banca                 │
├─────────────────────────────┤
│ ║ [1] SS 80kg × 10  RIR 2   │ ← bracket azul + badge SS
│ ║ [2] SS 80kg × 9   RIR 1   │
└─────────────────────────────┘
```

#### **Firestore Security:**
Las reglas existentes en `/sets/` ya permiten el campo `superset_group_id` (campos opcionales permitidos por defecto)

---

## Archivos Creados

### Sprint 2
- `SPRINT2_FEATURES.md` - Esta documentación

---

## Archivos Modificados

### Fase 3: Biblioteca de Programas
1. `src/types/admin.types.ts` - Extendido interface `Template` con campos `level`, `muscle_focus`, `required_equipment`, `focus`
2. `src/hooks/usePrograms.tsx` - Actualizado interface `ProgramTemplate` con campo `muscle_focus`
3. `src/components/programs/ProgramFilters.tsx` - Actualizados valores de filtros (`novato` en lugar de `beginner`)
4. `functions/src/seed.ts` - Agregadas 2 nuevas plantillas + actualización de lógica de seeding

### Fase 5: Supersets
5. `src/hooks/useWorkouts.tsx` - Agregado campo `superset_group_id` a interface `Set`
6. `src/components/workout/ExerciseCard.tsx` - UI visual para supersets con bracket y badge

---

## Uso en Producción

### 1. Filtrar Programas por Nivel
```tsx
import { usePrograms } from '@/hooks/usePrograms';

const { data: programs } = usePrograms({
  level: ['novato', 'intermedio'],
  focus: ['hypertrophy'],
  equipment: ['barbell', 'dumbbells'],
});
```

### 2. Crear Superseries
```tsx
// En el futuro, agregar botón "Agregar a superserie" en SetRowInline
const supersetGroupId = crypto.randomUUID();

await addSet({
  // ... otros campos
  superset_group_id: supersetGroupId,
});
```

### 3. Seed de Nuevas Plantillas
```bash
# Ejecutar desde Firebase Functions
firebase functions:shell

# Llamar función de seed
seedCatalogs()
```

---

## Mejoras de UX

### Antes ❌
- Solo 3 plantillas disponibles (GBR, PHUL, PHAT)
- Filtros limitados (solo `beginner/intermediate/advanced`)
- Sin soporte visual para superseries

### Después ✅
- **5 plantillas** con más variedad (novatos, intermedios, avanzados)
- **Filtros extendidos** por músculo, equipamiento y enfoque
- **Supersets visuales** con border lateral y badge
- **Mejor categorización** de niveles (novato, intermedio, avanzado)

---

## Próximos Pasos (Sprint 3)

### Biblioteca de Programas:
1. Agregar 5 plantillas más:
   - Arnold Split 6D
   - Stronglifts 5x5
   - nSuns 531
   - Upper/Lower Strength Focus
   - PPL (Push Pull Legs) 6D

2. Filtro por `muscle_focus` (ej: "Solo programas con foco en pecho")

### Supersets:
3. Botón "Agregar a superserie" en `SetRowInline`
4. Dialog para seleccionar ejercicio para superserie
5. Lógica automática para generar `superset_group_id`

### Onboarding Avanzado (Fase 6):
6. Calibración con múltiples sets
7. Importar pesos previos
8. Placeholder `useWearableIntegration()`

---

## Notas Técnicas

- **Firestore:** Campo `superset_group_id` es opcional, no requiere migración de datos existentes
- **Performance:** Filtrado client-side para evitar índices compuestos complejos
- **Design System:** Usa tokens semánticos (`border-primary`, `bg-primary/5`)
- **Responsive:** Todos los componentes son mobile-first
- **Validación:** Firestore rules existentes cubren nuevos campos opcionales

**Estado:** ✅ **COMPLETADO (Parcial)**
**Fecha:** 2025-10-14
**Pendiente:** Botón UI para crear superseries, 5 plantillas adicionales

---

## Testing

### Biblioteca de Programas:
```
1. Ir a /programs/browse
2. Aplicar filtros: Nivel = Novato, Enfoque = Hipertrofia
3. Verificar que aparece "Full Body 3 Días"
4. Aplicar filtros: Nivel = Intermedio, Equipamiento = Máquinas
5. Verificar que aparece "Bro Split 5 Días"
```

### Supersets (Visual):
```
1. Crear 2 sets en un workout
2. En Firestore, editar manualmente 2 sets del mismo ejercicio:
   - Agregar campo superset_group_id: "test-123" a ambos
3. Recargar /workout/today
4. Verificar border lateral azul y badge "SS"
```

---

## Criterios de Éxito

### Fase 3:
- [x] Template schema extendido con 4 campos nuevos
- [x] 2 nuevas plantillas agregadas (objetivo: 7-10 total)
- [x] Filtros actualizados con valores correctos
- [ ] Filtro por `muscle_focus` funcional (pendiente)

### Fase 5:
- [x] Campo `superset_group_id` en interface Set
- [x] UI visual con border y badge
- [ ] Botón "Agregar a superserie" (pendiente)
- [ ] Dialog de selección de ejercicio (pendiente)

**Progreso Sprint 2:** 60% completado
