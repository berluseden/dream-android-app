#!/usr/bin/env node
/**
 * Script para descargar y validar data de Firestore como admin
 * Uso: node scripts/validateAdminAccess.js
 */

const admin = require('firebase-admin');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ID = 'fitness-dfbb4';
const UID = '2frbDgeD3G1bvrh0hDtsGI3B2';

async function main() {
  try {
    // Intentar inicializar con credenciales por defecto
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: PROJECT_ID,
    });
    
  } catch (err) {
    // Si no funciona, usar gcloud auth
    try {
      execSync('gcloud auth application-default print-access-token > /dev/null 2>&1', { 
        stdio: 'ignore' 
      });
    } catch (e) {
      console.error('❌ Error: Necesitas ejecutar: gcloud auth login');
      process.exit(1);
    }
    
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
  
  const db = admin.firestore();
  
  console.log('📊 Validando acceso como admin...\n');
  
  try {
    // 1. Verificar rol del usuario
    console.log('1️⃣  Verificando tu rol...');
    const roleDoc = await db.collection('user_roles').doc(UID).get();
    if (roleDoc.exists()) {
      const role = roleDoc.data().role;
      console.log(`   ✅ Rol: ${role}`);
      if (role !== 'admin') {
        console.error(`   ❌ ERROR: Tu rol es "${role}", no "admin"`);
      }
    } else {
      console.error('   ❌ ERROR: No se encontró documento de rol');
    }
    
    // 2. Verificar perfil de usuario
    console.log('\n2️⃣  Verificando tu perfil...');
    const profileDoc = await db.collection('users').doc(UID).get();
    if (profileDoc.exists()) {
      const profile = profileDoc.data();
      console.log(`   ✅ Nombre: ${profile.name}`);
      console.log(`   ✅ Email: ${profile.email}`);
      console.log(`   ✅ Nivel: ${profile.level}`);
    } else {
      console.error('   ❌ ERROR: No se encontró perfil');
    }
    
    // 3. Contar documentos en colecciones críticas (admin-only)
    console.log('\n3️⃣  Acceso a colecciones admin-only...');
    
    const collections = [
      { name: 'users', maxDocs: 50 },
      { name: 'user_roles', maxDocs: 50 },
      { name: 'admin_settings', maxDocs: 10 },
      { name: 'audit_logs', maxDocs: 10 },
      { name: 'invitations', maxDocs: 50 },
      { name: 'templates', maxDocs: 20 },
      { name: 'exercises', maxDocs: 100 },
      { name: 'mesocycles', maxDocs: 50 },
      { name: 'workouts', maxDocs: 50 },
    ];
    
    for (const coll of collections) {
      try {
        const snap = await db.collection(coll.name).limit(1).get();
        console.log(`   ✅ ${coll.name}: readable`);
      } catch (err) {
        console.log(`   ❌ ${coll.name}: DENIED - ${err.message}`);
      }
    }
    
    // 4. Intentar escribir en admin_settings (test de escritura)
    console.log('\n4️⃣  Validando permisos de escritura...');
    try {
      const testRef = db.collection('admin_settings').doc('test_access');
      await testRef.set({
        test: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log('   ✅ Puedes escribir en admin_settings');
      
      // Limpiar
      await testRef.delete();
      console.log('   ✅ Puedes eliminar en admin_settings');
    } catch (err) {
      console.log(`   ❌ Escritura DENIED: ${err.message}`);
    }
    
    // 5. Contar total de documentos por colección
    console.log('\n5️⃣  Estadísticas de colecciones...');
    for (const coll of collections) {
      try {
        const snap = await db.collection(coll.name).count().get();
        const count = snap.data().count;
        console.log(`   📄 ${coll.name}: ${count} documentos`);
      } catch (err) {
        // Sin permisos
      }
    }
    
    // 6. Listar usuarios en el sistema
    console.log('\n6️⃣  Usuarios en el sistema...');
    try {
      const usersSnap = await db.collection('users').limit(10).get();
      console.log(`   Total visible: ${usersSnap.size} usuarios (limit 10)`);
      usersSnap.forEach((doc, idx) => {
        const data = doc.data();
        console.log(`     ${idx + 1}. ${data.name} (${data.email})`);
      });
    } catch (err) {
      console.log(`   ❌ No puedes leer usuarios: ${err.message}`);
    }
    
    // 7. Verificar reglas de audit logs
    console.log('\n7️⃣  Audit logs (admin-only)...');
    try {
      const auditSnap = await db.collection('audit_logs').limit(5).get();
      console.log(`   ✅ Puedes leer audit_logs: ${auditSnap.size} registros`);
    } catch (err) {
      console.log(`   ❌ No puedes leer audit_logs: ${err.message}`);
    }
    
    console.log('\n✅ Validación completada\n');
    
  } catch (error) {
    console.error('❌ Error durante validación:', error.message);
  } finally {
    await admin.app().delete();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
