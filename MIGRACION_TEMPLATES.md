# 🔄 Migración de Templates a Firestore

## Problema Identificado

Anteriormente, los programas de entrenamiento (templates) estaban almacenados como archivos JSON locales con IDs temporales (`local-0`, `local-1`, etc.). Esto causaba:

❌ **IDs inconsistentes**: Los mesociclos se guardaban con referencias `local-X` que no existen en Firestore  
❌ **Falta de trazabilidad**: Imposible rastrear qué programa real usó cada mesociclo  
❌ **Problemas de administración**: No se pueden gestionar programas desde la UI de admin  
❌ **Referencias rotas**: Las consultas a Firestore fallaban al buscar templates por ID  

## Solución Implementada

✅ **Script de migración automática** (`src/scripts/seedFirestore.ts`)  
✅ **Todos los templates ahora se crean en Firestore** con IDs reales  
✅ **Eliminado el fallback a templates locales**  
✅ **Validación obligatoria** de template_id en mesociclos  
✅ **UI de admin** para ejecutar la migración  

---

## 📋 Instrucciones de Migración

### Paso 1: Acceder al Panel de Admin

1. Inicia sesión como **administrador**
2. Ve a **Admin → Semillas y Migración** (`/admin/seed-migrate`)

### Paso 2: Ejecutar Migración

1. En la sección **"Migración de Templates"**, presiona el botón:
   ```
   Migrar Templates a Firestore
   ```

2. Espera la confirmación:
   ```
   ✅ Migración completada. 
   10 programas ahora tienen IDs reales en Firestore.
   ```

### Paso 3: Verificar

Los programas migrados incluyen:
- Upper/Lower Split (4 días)
- Push/Pull/Legs (6 días)  
- Arnold Split (6 días)
- nSuns 5/3/1 (5 días)
- Especialización Pecho (6 semanas)
- Especialización Espalda (6 semanas)
- Especialización Hombros (6 semanas)
- Quads & Glutes Strength (8 semanas)
- Peaking Strength (6 semanas)
- Posterior Chain (8 semanas)

---

## 🔍 Estructura en Firestore

### Colección: `templates`

```typescript
{
  id: string,                    // ✅ ID real de Firestore (ya no local-X)
  name: string,                  // Nombre del programa
  description: string,           // Descripción
  split: string,                 // Tipo de split
  weeks: number,                 // Duración en semanas
  days_per_week: number,         // Frecuencia semanal
  level: 'beginner' | 'intermediate' | 'advanced',
  required_equipment: string[],
  muscle_focus: string[],
  focus: 'hypertrophy' | 'strength' | 'endurance',
  rating_avg: number,
  rating_count: number,
  times_used: number,
  sessions: [{                   // Sesiones del programa
    name: string,
    blocks: [{
      exercise_name: string,
      sets: number,
      rep_range_min: number,
      rep_range_max: number,
      rir_target: number,
      rest_seconds: number,
    }]
  }],
  is_public: boolean,            // Visible en catálogo
  created_at: Timestamp,
}
```

### Relación con Mesociclos

```typescript
// mesocycles collection
{
  id: string,
  template_id: string,  // ✅ Ahora referencia un ID real de Firestore
  user_id: string,
  name: string,
  start_date: Timestamp,
  // ...
}
```

---

## 🚨 Importante

### ANTES de crear mesociclos:
1. **Ejecuta la migración primero**
2. Verifica que aparezcan los 10 programas en **"Explorar Programas"**
3. Solo entonces procede a crear mesociclos

### Si ves este error:
```
Template no encontrado. Por favor ejecuta primero la migración de templates.
```

**Solución**: Ve a Admin → Semillas y Migración y ejecuta la migración.

---

## 🔧 Cambios en el Código

### Archivos Modificados:

1. **`src/scripts/seedFirestore.ts`**
   - Añadida función `seedTemplates()` para migrar templates
   - Normaliza estructura de JSON locales a formato Firestore

2. **`src/hooks/usePrograms.tsx`**
   - Eliminado fallback a templates locales
   - Ahora solo consulta Firestore
   - Añadido hook `useTemplate(id)` para obtener template específico

3. **`src/hooks/useMesocycles.tsx`**
   - Eliminada lógica de conversión `local-X` → Firestore
   - Validación obligatoria de `template_id` en Firestore
   - Rollback automático si falla generación de workouts

4. **`src/pages/mesocycles/CreateMesocycle.tsx`**
   - Simplificado para solo buscar en Firestore
   - Eliminado manejo de templates locales

5. **`src/hooks/useBackups.tsx`**
   - `useSeedCatalogs()` ahora llama a `seedTemplates()`

6. **`src/pages/admin/AdminSeedMigrate.tsx`**
   - UI actualizada para reflejar migración de templates

---

## ✅ Checklist Post-Migración

- [ ] Migración ejecutada sin errores
- [ ] 10 programas visibles en "Explorar Programas"
- [ ] Cada programa tiene badge de días/semana correcto
- [ ] Al crear mesociclo, se asigna template correctamente
- [ ] Los workouts se generan automáticamente
- [ ] No hay referencias `local-X` en nuevos mesociclos

---

## 🎯 Resultado

✅ Todos los mesociclos ahora usan IDs reales de Firestore  
✅ Trazabilidad completa de qué programa usa cada usuario  
✅ Posibilidad de administrar programas desde UI  
✅ Queries eficientes sin fallbacks complejos  
✅ Base sólida para features futuros (ratings, analytics, etc.)
