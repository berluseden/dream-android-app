import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCRqrK8oOYDafgmGqRHbso-_BpLozkDlsA",
  authDomain: "fitness-dfbb4.firebaseapp.com",
  projectId: "fitness-dfbb4",
  storageBucket: "fitness-dfbb4.firebasestorage.app",
  messagingSenderId: "437995448295",
  appId: "1:437995448295:web:6d069d7d520ddbcd633f42",
  measurementId: "G-KZ2X47WGG0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not supported');
  }
});

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
