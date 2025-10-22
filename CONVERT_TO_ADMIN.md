# Script para convertir usuario a Admin

## Opción 1: Ejecutar en la consola del navegador (F12)

1. Ve a https://fitness-dfbb4.web.app
2. Abre la consola del navegador (F12 → Console)
3. Pega y ejecuta este código:

```javascript
// Importar Firestore
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

// Actualizar rol en users
const userId = 'ZfrDygEd36YqiMuvhhCdtw3G3UB2';

// Actualizar en users collection
await updateDoc(doc(db, 'users', userId), {
  role: 'admin'
});
console.log('✅ users/{uid}.role actualizado a admin');
console.log('🎉 Usuario convertido a admin exitosamente!');
console.log('💡 Recarga la página (Ctrl+Shift+R) para ver los cambios');
```

## Opción 2: Desde el panel Settings de la app

1. Ve a https://fitness-dfbb4.web.app/settings
2. Abre la consola del navegador (F12)
3. Ejecuta:

```javascript
// Método simplificado usando el hook ya disponible
const { refreshProfile } = useAuth();

// Actualizar directamente en Firestore
await fetch('https://us-central1-fitness-dfbb4.cloudfunctions.net/setUserRole', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: {
      userId: 'ZfrDygEd36YqiMuvhhCdtw3G3UB2',
      role: 'admin'
    }
  })
});

// Refrescar perfil
await refreshProfile();
console.log('✅ Rol actualizado a admin');
```

## Opción 3: Usar Firebase Console (Manual)

1. Ve a https://console.firebase.google.com/project/fitness-dfbb4/firestore
2. Navega a `users/ZfrDygEd36YqiMuvhhCdtw3G3UB2`
3. Haz clic en "Add field"
3. Campo: `role`, Valor: `admin`
4. Guarda

## Verificación

Después de ejecutar cualquiera de estas opciones:

1. Recarga la aplicación (Ctrl+Shift+R)
2. Deberías ver "Administración" en el menú lateral
3. Ve a `/admin/seed-migrate` para cargar los templates
