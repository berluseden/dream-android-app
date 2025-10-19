#!/usr/bin/env node

/**
 * Script para actualizar el rol del usuario a admin
 * Este script se ejecuta desde el cliente usando la Cloud Function
 * 
 * Uso:
 *   node scripts/makeAdmin.cjs <user_uid>
 */

const USER_UID = process.argv[2] || 'ZfrDygEd36YqiMuvhhCdtw3G3UB2';

console.log(`
🔐 Para convertir a ${USER_UID} en admin, necesitas:

1. Abre la aplicación: https://fitness-dfbb4.web.app
2. Inicia sesión con tu cuenta admin (ya lo eres)
3. Ve a Administración → Usuarios
4. Busca al usuario ${USER_UID}
5. Haz clic en "Cambiar rol" 
6. Selecciona "admin"
7. Confirma

O alternativamente, abre la consola del navegador (F12) y ejecuta:

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const setUserRole = httpsCallable(functions, 'setUserRole');
await setUserRole({ 
  userId: '${USER_UID}', 
  newRole: 'admin' 
});

Esto actualizará el rol en:
- user_roles/${USER_UID} (legacy)
- users/${USER_UID}.role (nuevo)
`);
