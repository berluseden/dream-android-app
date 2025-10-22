#!/usr/bin/env node

/**
 * Script completo para:
 * 1. Migrar roles de user_roles a users
 * 2. Convertir usuario específico a admin
 */

const admin = require('firebase-admin');

const PROJECT_ID = 'fitness-dfbb4';
const TARGET_UID = 'ZfrDygEd36YqiMuvhhCdtw3G3UB2';

// Inicializar Firebase Admin con el proyecto
const options = {
  projectId: PROJECT_ID,
};

if (!admin.apps.length) {
  admin.initializeApp(options);
}

const db = admin.firestore();

async function main() {
  try {
    console.log('🔄 Iniciando proceso de migración y promoción de rol...\n');

    // Paso 1: Verificar usuario actual
    console.log('📋 Paso 1: Verificando usuario...');
    const userDoc = await db.collection('users').doc(TARGET_UID).get();
    if (!userDoc.exists) {
      console.log('❌ El usuario no existe en Firestore');
      process.exit(1);
    }
    const currentUser = userDoc.data();
    console.log('✅ Usuario encontrado:', {
      uid: TARGET_UID,
      email: currentUser.email,
      name: currentUser.name,
      roleActual: currentUser.role || 'N/A'
    });

    // Paso 2: Verificar user_roles
    console.log('\n📋 Paso 2: Verificando role document en user_roles...');
    const roleDoc = await db.collection('user_roles').doc(TARGET_UID).get();
    if (roleDoc.exists) {
      console.log('✅ Role document encontrado:', roleDoc.data());
    } else {
      console.log('⚠️  No existe role document en user_roles');
      console.log('   Creando uno...');
      await db.collection('user_roles').doc(TARGET_UID).set({
        id: TARGET_UID,
        user_id: TARGET_UID,
        role: 'user'
      });
      console.log('✅ Role document creado');
    }

    // Paso 3: Actualizar a admin
    console.log('\n📋 Paso 3: Actualizando rol a admin...');
    
    // Actualizar en user_roles (legacy)
    await db.collection('user_roles').doc(TARGET_UID).update({
      role: 'admin'
    });
    console.log('✅ user_roles actualizado');

    // Actualizar en users (nuevo)
    await db.collection('users').doc(TARGET_UID).update({
      role: 'admin'
    });
    console.log('✅ users.role actualizado');

    // Paso 4: Verificación final
    console.log('\n📋 Paso 4: Verificando cambios...');
    const updatedUserDoc = await db.collection('users').doc(TARGET_UID).get();
    const updatedRoleDoc = await db.collection('user_roles').doc(TARGET_UID).get();

    console.log('📊 Estado final:');
    console.log('   users/{uid}.role:', updatedUserDoc.data().role);
    console.log('   user_roles/{uid}.role:', updatedRoleDoc.data().role);

    if (updatedUserDoc.data().role === 'admin' && updatedRoleDoc.data().role === 'admin') {
      console.log('\n✅ ¡Migración y promoción completada exitosamente!');
      console.log('\n🎉 El usuario es ahora admin. Cambios:');
      console.log('   - Tiene acceso a /admin/*');
      console.log('   - Puede gestionar usuarios, roles, configuración');
      console.log('   - Puede ver logs de auditoría');
      console.log('\n💡 Para que los cambios surtan efecto:');
      console.log('   1. Recarga la aplicación (Ctrl+Shift+R o Cmd+Shift+R)');
      console.log('   2. Vuelve a iniciar sesión si es necesario');
      console.log('   3. Verifica que veas la opción de Administración en el menú');
    } else {
      console.log('\n⚠️  Hubo un problema en la actualización');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
