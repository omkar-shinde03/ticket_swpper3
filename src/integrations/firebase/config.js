import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAVITXYXQaGYLBY2PlBBdPdC9s_tibcFt8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "phonenum-verifation.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "phonenum-verifation",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "phonenum-verifation.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "618942453575",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:618942453575:web:cc0862c262d7009967de62",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-X32F03FBFK"
};

// Debug logging
console.log('🔍 Debug: Firebase config:', firebaseConfig);
console.log('🔍 Debug: Environment variables loaded:', {
  VITE_FIREBASE_API_KEY: !!import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: !!import.meta.env.VITE_FIREBASE_PROJECT_ID
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('🔍 Debug: Firebase app initialized:', !!app);

// Initialize Firebase Authentication
export const auth = getAuth(app);
console.log('🔍 Debug: Firebase auth initialized:', !!auth);
console.log('🔍 Debug: Auth methods available:', {
  signInWithPhoneNumber: typeof auth.signInWithPhoneNumber,
  signInWithEmailAndPassword: typeof auth.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: typeof auth.createUserWithEmailAndPassword
});

// Export the app instance
export default app;
