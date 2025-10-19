#!/usr/bin/env node

/**
 * Script de migración: Copia roles de user_roles/{uid} a users/{uid}.role
 * 
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/credentials.json node scripts/migrateRolesToUsers.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  // Intentar cargar credenciales desde variable de entorno
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS no está configurada');
    console.error('   Ejecuta: GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/credentials.json node scripts/migrateRolesToUsers.cjs');
    process.exit(1);
  }

  const credentials = require(path.resolve(credentialsPath));
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

const db = admin.firestore();

async function migrateRolesToUsers() {
  console.log('🔄 Iniciando migración de roles...\n');

  try {
    // Obtener todos los documentos de user_roles
    const userRolesSnapshot = await db.collection('user_roles').get();
    
    if (userRolesSnapshot.empty) {
      console.log('⚠️  No hay documentos en user_roles. Migración cancelada.');
      return;
    }

    console.log(`📋 Encontrados ${userRolesSnapshot.size} documentos en user_roles\n`);

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const doc of userRolesSnapshot.docs) {
      const roleData = doc.data();
      const userId = roleData.user_id || doc.id;
      const role = roleData.role || 'user';

      try {
        // Actualizar el documento users/{userId} con el campo role
        await db.collection('users').doc(userId).update({
          role: role,
        });

        successCount++;
        results.push({
          userId,
          role,
          status: '✅ Migrado',
        });
        console.log(`✅ ${userId}: role=${role}`);
      } catch (error) {
        if (error.code === 'not-found') {
          console.log(`⚠️  ${userId}: documento users no encontrado (se creará si es necesario)`);
          // Opcionalmente, crear el documento con solo el rol
          await db.collection('users').doc(userId).set({
            role: role,
          }, { merge: true });
          successCount++;
          results.push({
            userId,
            role,
            status: '✅ Creado',
          });
        } else {
          errorCount++;
          results.push({
            userId,
            role,
            status: `❌ Error: ${error.message}`,
          });
          console.log(`❌ ${userId}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Resumen de migración:`);
    console.log(`   Exitosos: ${successCount}`);
    console.log(`   Errores: ${errorCount}`);
    console.log(`   Total: ${successCount + errorCount}`);

    if (errorCount === 0) {
      console.log('\n✅ Migración completada exitosamente');
    } else {
      console.log('\n⚠️  Migración completada con algunos errores');
    }

    // Mostrar resumen detallado
    console.log('\n📋 Detalles:');
    results.forEach((r) => {
      console.log(`   ${r.userId}: ${r.status}`);
    });

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar migración
migrateRolesToUsers()
  .then(() => {
    console.log('\n✨ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
