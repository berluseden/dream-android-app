# Migración: Simplificación de Arquitectura de Roles

## Resumen de cambios

Se ha simplificado la arquitectura de gestión de roles, eliminando la necesidad de tener dos documentos separados (`users` y `user_roles`) y unificándola en un solo documento `users` con un campo `role` incrustado.

### Cambios implementados:

#### 1. **Actualización de tipos** (`src/types/user.types.ts`)
```typescript
export interface UserProfile {
  id: string;
  email: string;
  // ... otros campos
  role?: UserRole; // ← NUEVO
  created_at: Date;
  updated_at: Date;
}
```

#### 2. **Refactor de autenticación** (`src/hooks/useAuth.tsx`)
- Fusionado `fetchProfile()` y `fetchRole()` en una sola función
- Ahora lee rol directamente de `users/{uid}.role`
- Listener real-time en `users` en lugar de `user_roles`
- Simplificado `refreshProfile()` para leer de un solo documento

**Beneficios:**
- ✅ Una lectura de Firestore en lugar de dos
- ✅ Código más simple y mantenible
- ✅ Mejor rendimiento

#### 3. **Actualización de reglas de Firestore** (`firestore.rules`)
```plaintext
// Antes: hasRole() leía de user_roles/{uid}
// Ahora: hasRole() lee de users/{uid}.role
function hasRole(role) {
  return exists(/databases/$(database)/documents/users/$(request.auth.uid))
         && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
}
```

- Protección del campo `role`: solo admin puede modificarlo
- `user_roles` collection mantenida para compatibilidad hacia atrás

#### 4. **Script de migración** (`scripts/migrateRolesToUsers.cjs`)
Script que copia roles existentes de `user_roles/{uid}` a `users/{uid}.role`.

## Instrucciones para migración

### Paso 1: Obtener credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Proyecto: `fitness-dfbb4`
3. ⚙️ Configuración → Cuentas de servicio
4. Haz clic en "Generar nueva clave privada"
5. Guarda el archivo JSON en un lugar seguro (ej: `/tmp/credentials.json`)

### Paso 2: Ejecutar la migración

```bash
# En la raíz del proyecto
GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/credentials.json node scripts/migrateRolesToUsers.cjs
```

**Ejemplo con salida esperada:**
```
🔄 Iniciando migración de roles...

📋 Encontrados 5 documentos en user_roles

✅ user123: role=admin
✅ user456: role=coach
✅ user789: role=user
...

📊 Resumen de migración:
   Exitosos: 5
   Errores: 0
   Total: 5

✅ Migración completada exitosamente
```

### Paso 3: Verificación

#### Opción A: Console de Firestore
1. Ve a [Firestore Console](https://console.firebase.google.com/project/fitness-dfbb4/firestore)
2. Abre colección `users`
3. Verifica que cada documento tenga el campo `role` con el valor correcto

#### Opción B: Script de verificación (opcional)

```bash
# Verificar que todos los roles fueron copiados
GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/credentials.json node -e "
const admin = require('firebase-admin');
const path = require('path');

const credentials = require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS));
admin.initializeApp({ credential: admin.credential.cert(credentials) });

const db = admin.firestore();

(async () => {
  const snap = await db.collection('users').where('role', '!=', null).get();
  console.log('✅ Documentos con campo role:', snap.size);
  snap.forEach(doc => {
    console.log('  -', doc.id, ':', doc.data().role);
  });
  process.exit(0);
})();
"
```

## Testing en la aplicación

1. **Reload de la aplicación** (Ctrl+Shift+R para limpiar caché)
2. Abre la consola del navegador (F12)
3. Busca logs de `useAuth.tsx`:
   - `✅ Perfil y rol obtenidos...` — indicador de carga exitosa
   - `🔄 Perfil actualizado en tiempo real...` — listener funcionando
   - `📢 Cambio de rol detectado...` — detección de cambios en tiempo real

4. **Test de permisos:**
   - Si eres admin: acceso a `/admin/*`
   - Si eres coach: acceso a `/coach/*`
   - Si eres user: acceso normal restringido

## Rollback (si es necesario)

Si algo falla, puedes revertir los cambios:

```bash
# Revertir el último commit
git revert HEAD

# O volver a la versión anterior
git checkout c1cfca7
npm run build
firebase deploy
```

## Limpieza posterior (opcional, hacer después de 1 semana)

Una vez confirmado que todo funciona correctamente, puedes:

1. **Eliminar reglas de `user_roles`** en `firestore.rules`
2. **Eliminar documentos de `user_roles`** en Firestore Console
3. **Eliminar la colección `user_roles`** completamente

```bash
# Actualizar firestore.rules
# - Eliminar match /user_roles/{roleId} block

git add firestore.rules
git commit -m "cleanup(firestore): remove deprecated user_roles collection rules"
firebase deploy --only firestore:rules
```

## FAQ

**¿Qué pasa si ejecuto la migración dos veces?**
> Es seguro. El script es idempotente - puede ejecutarse múltiples veces sin problemas.

**¿Qué ocurre durante la migración con los usuarios conectados?**
> Los usuarios verán una notificación "Tu rol ha sido actualizado" y los listeners se actualizarán automáticamente.

**¿Se pierden datos?**
> No. La migración solo lee de `user_roles` y escribe en `users` - no elimina nada.

## Soporte

Si encuentras problemas:

1. Verifica los logs: `firebase functions:log`
2. Revisa la consola de Firestore por errores de reglas
3. Restaura credenciales en `functions/` si algo falló

---

**Estado del despliegue:**
- ✅ Frontend actualizado (FitnessApp v0.x.x)
- ✅ Firestore rules desplegadas
- ✅ TypeScript sin errores
- ⏳ Migración de datos (manual)
