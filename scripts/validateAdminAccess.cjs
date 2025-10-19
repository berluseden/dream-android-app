#!/usr/bin/env node
/**
 * Script para descargar y validar data de Firestore como admin
 * Usa .cjs para CommonJS compatibility
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
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: PROJECT_ID,
      });
    } catch (err) {
      console.error('❌ Necesitas autenticarte con gcloud:');
      console.error('   gcloud auth login');
      console.error('   gcloud auth application-default login');
      process.exit(1);
    }
    
    const db = admin.firestore();
    
    console.log('📊 Validando acceso como admin...\n');
    
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
    
    // 3. Contar documentos en colecciones críticas
    console.log('\n3️⃣  Acceso a colecciones...');
    
    const collections = [
      'users',
      'user_roles', 
      'admin_settings',
      'audit_logs',
      'invitations',
      'templates',
      'exercises',
      'mesocycles',
      'workouts',
    ];
    
    for (const coll of collections) {
      try {
        const snap = await db.collection(coll).limit(1).get();
        console.log(`   ✅ ${coll}: readable`);
      } catch (err) {
        console.log(`   ❌ ${coll}: DENIED - ${err.code}`);
      }
    }
    
    // 4. Contar total de documentos por colección
    console.log('\n4️⃣  Estadísticas de colecciones...');
    for (const coll of collections) {
      try {
        const snap = await db.collection(coll).count().get();
        const count = snap.data().count;
        console.log(`   📄 ${coll}: ${count} documentos`);
      } catch (err) {
        // Sin permisos
      }
    }
    
    // 5. Listar usuarios
    console.log('\n5️⃣  Usuarios en el sistema...');
    try {
      const usersSnap = await db.collection('users').limit(10).get();
      console.log(`   Total visible: ${usersSnap.size} usuarios`);
      usersSnap.forEach((doc, idx) => {
        const data = doc.data();
        console.log(`     ${idx + 1}. ${data.name} (${data.email})`);
      });
    } catch (err) {
      console.log(`   ❌ No puedes leer usuarios: ${err.message}`);
    }
    
    // 6. Verificar audit logs
    console.log('\n6️⃣  Audit logs (admin-only)...');
    try {
      const auditSnap = await db.collection('audit_logs').limit(5).get();
      console.log(`   ✅ Puedes leer audit_logs: ${auditSnap.size} registros`);
      auditSnap.forEach((doc, idx) => {
        const data = doc.data();
        console.log(`     ${idx + 1}. ${data.action} por ${data.actor_id}`);
      });
    } catch (err) {
      console.log(`   ❌ No puedes leer audit_logs: ${err.message}`);
    }
    
    // 7. Verificar templates
    console.log('\n7️⃣  Templates disponibles...');
    try {
      const templateSnap = await db.collection('templates').limit(10).get();
      console.log(`   ✅ Templates: ${templateSnap.size} disponibles`);
      templateSnap.forEach((doc, idx) => {
        const data = doc.data();
        console.log(`     ${idx + 1}. ${data.name} (${data.days_per_week}d/sem)`);
      });
    } catch (err) {
      console.log(`   ❌ No puedes leer templates: ${err.message}`);
    }
    
    console.log('\n✅ Validación completada\n');
    
  } catch (error) {
    console.error('❌ Error durante validación:', error.message);
  } finally {
    try {
      await admin.app().delete();
    } catch (e) {
      // Ignorar error al limpiar
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
