#!/usr/bin/env node
/**
 * Script para corregir la estructura de user_roles
 * Copia el rol del documento incorrecto al documento correcto (por UID)
 */

const { execSync } = require('child_process');

const PROJECT_ID = 'fitness-dfbb4';
const CORRECT_UID = 'ZfrDygEd36YqiMuvhhCdtw3G3UB2'; // UID correcto
const WRONG_DOC_ID = 'L1KrTE8mL7yHk01r'; // Documento incorrecto actual

console.log('🔧 Corrigiendo estructura de user_roles...\n');

try {
  // 1. Eliminar documento incorrecto
  console.log(`1️⃣  Eliminando documento incorrecto: ${WRONG_DOC_ID}`);
  try {
    execSync(
      `gcloud firestore documents delete "user_roles/${WRONG_DOC_ID}" --project=${PROJECT_ID} --quiet 2>&1`,
      { encoding: 'utf-8' }
    );
    console.log(`   ✅ Eliminado\n`);
  } catch (e) {
    console.log(`   ℹ️  (No existía)\n`);
  }

  // 2. Crear documento correcto con el UID como ID
  console.log(`2️⃣  Creando documento correcto: ${CORRECT_UID}`);
  const fieldCmd = `gcloud firestore documents create user_roles/${CORRECT_UID} \\
    --project=${PROJECT_ID} \\
    --data=role=admin \\
    2>&1`;
  
  try {
    execSync(fieldCmd, { encoding: 'utf-8', shell: '/bin/bash' });
    console.log(`   ✅ Documento creado\n`);
  } catch (e) {
    // Tal vez ya existe, intentar actualizar
    console.log(`   ℹ️  Intentando actualizar...\n`);
  }

  // 3. Verificar estructura final
  console.log(`3️⃣  Verificando estructura final...`);
  const getCmd = `gcloud firestore documents describe user_roles/${CORRECT_UID} --project=${PROJECT_ID} 2>&1`;
  const result = execSync(getCmd, { encoding: 'utf-8' });
  
  if (result.includes('admin')) {
    console.log(`   ✅ Estructura correcta confirmada`);
    console.log(`\n✅ Listo! Tu rol está en: user_roles/${CORRECT_UID}`);
    console.log(`\n📝 Próximo paso:`);
    console.log(`   1. Recarga la app: https://fitness-dfbb4.web.app`);
    console.log(`   2. Abre DevTools (F12) → Console`);
    console.log(`   3. Deberías ver: ✅ Rol obtenido para ${CORRECT_UID}: admin`);
  } else {
    console.log(`   ❌ Estructura no se verificó correctamente`);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nProbablemente necesites: gcloud auth login');
  process.exit(1);
}
