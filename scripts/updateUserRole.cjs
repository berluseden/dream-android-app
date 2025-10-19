#!/usr/bin/env node

/**
 * Script para actualizar rol de usuario directamente en Firestore
 * Usa la API de REST de Firestore con autenticación de Firebase CLI
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'fitness-dfbb4';
const USER_UID = 'ZfrDygEd36YqiMuvhhCdtw3G3UB2';
const NEW_ROLE = 'admin';

async function getAccessToken() {
  try {
    const token = execSync('firebase projects:list --json | jq -r ".[] | select(.projectId==\\"' + PROJECT_ID + '\\") | .token // empty" 2>/dev/null || echo ""').toString().trim();
    
    if (!token) {
      console.log('🔐 Autenticando con Firebase CLI...');
      execSync('firebase login --no-localhost', { stdio: 'inherit' });
    }
    
    const result = execSync('firebase auth:export /tmp/export.json --project ' + PROJECT_ID + ' 2>&1 || true').toString();
    console.log(result.slice(0, 100));
    return null;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function updateUserRole() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${USER_UID}`;
  
  const body = {
    fields: {
      role: {
        stringValue: NEW_ROLE
      }
    }
  };
  
  console.log('🔄 Intentando actualizar rol vía REST API...');
  console.log('URL:', url);
  console.log('Body:', JSON.stringify(body, null, 2));
}

updateUserRole().catch(console.error);
