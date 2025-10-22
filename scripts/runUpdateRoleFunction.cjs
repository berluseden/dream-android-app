#!/usr/bin/env node

/**
 * Script para ejecutar Cloud Function desde terminal
 * Usa firebase emulator o requiere autenticación
 */

async function updateUserRoleViaHTTP() {
  const PROJECT_ID = 'fitness-dfbb4';
  const REGION = 'us-central1';
  const FUNCTION_NAME = 'updateUserRole';
  const USER_UID = 'ZfrDygEd36YqiMuvhhCdtw3G3UB2';
  const NEW_ROLE = 'admin';

  try {
    // Primero necesitamos un token de Firebase Authentication
    console.log('Para ejecutar esta función necesitas autenticarte como admin');
    console.log('\nOpciones:');
    console.log('1. Usa la UI en https://fitness-dfbb4.web.app → Admin → Usuarios');
    console.log('2. Ejecuta esto en la consola del navegador (F12):');
    console.log(`
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const updateRole = httpsCallable(functions, 'updateUserRole');
const result = await updateRole({ 
  userId: '${USER_UID}', 
  role: '${NEW_ROLE}' 
});
console.log('✅ Resultado:', result.data);
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateUserRoleViaHTTP();
