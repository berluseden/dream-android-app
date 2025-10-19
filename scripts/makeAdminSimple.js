#!/usr/bin/env node
/**
 * Promocionar usuario a admin en Firestore
 * Uso: node scripts/makeAdminSimple.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const UID = '2frbDgeD3G1bvrh0hDtsGI3B2';
const PROJECT_ID = 'fitness-dfbb4';

async function main() {
  let serviceAccountPath = path.join(process.env.HOME, '.config', 'gcloud', 'application_default_credentials.json');
  
  // Fallback a local path
  if (!fs.existsSync(serviceAccountPath)) {
    serviceAccountPath = path.join(__dirname, '..', '.firebase', 'service-account-key.json');
  }
  
  // Si no existe, usar credenciales por defecto de gcloud/firebase login
  try {
    const credential = fs.existsSync(serviceAccountPath)
      ? admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8')))
      : admin.credential.applicationDefault();
    
    admin.initializeApp({
      credential,
      projectId: PROJECT_ID,
    });
    
    const db = admin.firestore();
    
    console.log(`⏳ Promocionando ${UID} a admin...`);
    
    await db.collection('user_roles').doc(UID).set({
      role: 'admin',
      promoted_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log('✅ ¡Listo! Usuario es ahora ADMIN');
    console.log('   Recarga la app en el navegador (presiona F5 o Ctrl+R)');
    
    await admin.app().delete();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Alternativa manual:');
    console.error('1. Ve a: https://console.firebase.google.com/project/fitness-dfbb4/firestore');
    console.error('2. Haz clic en "+ Iniciar colección"');
    console.error('3. Nombre: user_roles');
    console.error(`4. ID del documento: ${UID}`);
    console.error('5. Campo "role" = "admin"');
    console.error('6. Guarda y recarga la app');
    process.exit(1);
  }
}

main();
