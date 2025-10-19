#!/usr/bin/env node
/**
 * Script para reparar la estructura del documento de rol en Firestore
 * Uso: node scripts/fixRoleStructure.cjs
 * 
 * Problema: El documento está con ID incorrecto (L1KrTE8mL7yHk01r)
 * Solución: Crear documento con ID correcto (tu UID) y eliminar el incorrecto
 */

const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'fitness-dfbb4';
const UID = '2frbDgeD3G1bvrh0hDtsGI3B2'; // Tu UID correcto
const WRONG_DOC_ID = 'L1KrTE8mL7yHk01r'; // El documento incorrecto

let accessToken = null;

// Obtener access token usando Firebase CLI
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    try {
      // Usar gcloud auth para obtener el token
      const token = execSync('gcloud auth application-default print-access-token 2>/dev/null || gcloud auth print-access-token', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
      
      if (token) {
        resolve(token);
      } else {
        reject(new Error('No token'));
      }
    } catch (err) {
      reject(err);
    }
  });
}

// Hacer request a Firestore REST API
function firestoreRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents${path}`;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : null);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Obteniendo token de acceso...');
    accessToken = await getAccessToken();
    console.log('✅ Token obtenido\n');
    
    console.log('📋 Reparando estructura de user_roles...\n');
    
    // 1. Obtener el documento incorrecto
    console.log(`1️⃣  Obteniendo documento incorrecto: ${WRONG_DOC_ID}`);
    try {
      const wrongDoc = await firestoreRequest('GET', `/user_roles/${WRONG_DOC_ID}`);
      const wrongRole = wrongDoc.fields?.role?.stringValue || wrongDoc.fields?.role?.reference;
      console.log(`   ✅ Encontrado, rol: ${wrongRole}\n`);
      
      // 2. Crear documento correcto con el rol
      console.log(`2️⃣  Creando documento correcto: ${UID}`);
      await firestoreRequest('PATCH', `/user_roles/${UID}`, {
        fields: {
          role: { stringValue: 'admin' },
          promoted_at: { timestampValue: new Date().toISOString() },
        }
      });
      console.log(`   ✅ Documento creado\n`);
      
      // 3. Eliminar documento incorrecto
      console.log(`3️⃣  Eliminando documento incorrecto: ${WRONG_DOC_ID}`);
      await firestoreRequest('DELETE', `/user_roles/${WRONG_DOC_ID}`);
      console.log(`   ✅ Documento eliminado\n`);
      
    } catch (err) {
      if (err.message.includes('404') || err.message.includes('NOT_FOUND')) {
        console.log(`   ℹ️  Documento no encontrado (quizás ya fue eliminado)\n`);
      } else {
        throw err;
      }
    }
    
    // 4. Verificar documento correcto
    console.log(`4️⃣  Verificando documento correcto: ${UID}`);
    try {
      const correctDoc = await firestoreRequest('GET', `/user_roles/${UID}`);
      const role = correctDoc.fields?.role?.stringValue;
      console.log(`   ✅ Documento OK - Rol: ${role}\n`);
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
    }
    
    console.log('✅ Reparación completada');
    console.log('\n📝 Próximo paso:');
    console.log('1. Recarga la app en el navegador (F5)');
    console.log('2. Abre DevTools (F12) → Console');
    console.log('3. Deberías ver: ✅ Rol obtenido... admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nSolución alternativa:');
    console.error('1. Ve a: https://console.firebase.google.com/project/fitness-dfbb4/firestore');
    console.error('2. En user_roles, elimina documento: L1KrTE8mL7yHk01r');
    console.error('3. Crea nuevo documento con ID: 2frbDgeD3G1bvrh0hDtsGI3B2');
    console.error('4. Añade campo: role = "admin"');
    process.exit(1);
  }
}

main();
