#!/usr/bin/env node
/**
 * Script para promocionar un usuario a admin en Firestore
 * Uso: node scripts/makeAdmin.js
 * 
 * Requiere estar autenticado con Firebase CLI: firebase login
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const uid = '2frbDgeD3G1bvrh0hDtsGI3B2'; // Tu UID
const projectId = 'fitness-dfbb4';

async function makeAdmin() {
  try {
    console.log(`⏳ Promocionando ${uid} a admin...`);
    
    // Obtener la configuración actual del usuario
    let userData = {};
    try {
      const result = execSync(
        `firebase firestore --project ${projectId} -- <<'EOF'\ndb.collection('user_roles').doc('${uid}').get().then(doc => console.log(JSON.stringify(doc.data())));\nEOF`,
        { encoding: 'utf-8' }
      );
      if (result.includes('{')) {
        userData = JSON.parse(result.split('{')[1]);
      }
    } catch (e) {
      // Usuario no existe aún, es ok
    }
    
    // Usar Node.js con firebase-admin si disponible
    const adminPath = require.resolve('firebase-admin');
    if (adminPath) {
      const admin = require('firebase-admin');
      
      // Intentar usar credenciales de cuenta de servicio
      const serviceAccountPath = path.join(__dirname, '..', '.firebase', 'service-account-key.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId,
        });
        
        const db = admin.firestore();
        await db.collection('user_roles').doc(uid).set({
          role: 'admin',
          promoted_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        
        console.log('✅ ¡Usuario promocionado a admin!');
        console.log('   Recarga la app en el navegador para que se refleje el cambio.');
        await admin.app().delete();
        process.exit(0);
      }
    }
    
    // Fallback: mostrar instrucciones manuales
    console.log('');
    console.log('📋 Para hacerlo manualmente:');
    console.log('1. Ve a: https://console.firebase.google.com/project/fitness-dfbb4/firestore');
    console.log('2. En la colección "user_roles", crea un documento con:');
    console.log(`   - ID: ${uid}`);
    console.log('   - Campo "role": "admin"');
    console.log('3. Guarda y recarga la app en el navegador');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();
