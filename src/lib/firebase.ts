import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore,
  connectFirestoreEmulator, 
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { logger } from './logger';

// Validar variables de entorno críticas
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

// Solo validar en producción (en dev usamos config hardcoded)
if (!import.meta.env.DEV) {
  requiredEnvVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      throw new Error(`❌ Missing required environment variable: ${varName}`);
    }
  });
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCRqrK8oOYDafgmGqRHbso-_BpLozkDlsA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fitness-dfbb4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fitness-dfbb4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fitness-dfbb4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "437995448295",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:437995448295:web:6d069d7d520ddbcd633f42",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KZ2X47WGG0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Enable offline persistence (solo intentar, ignorar errores)
enableIndexedDbPersistence(db, {
  forceOwnership: false // Permite múltiples tabs
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    logger.warn('⚠️ Persistence: Multiple tabs open, using memory cache');
  } else if (err.code === 'unimplemented') {
    logger.warn('⚠️ Persistence: Not supported in this browser');
  } else {
    logger.warn('⚠️ Persistence error:', err);
  }
});

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
