import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase keys are set up. If not, print a warning and fallback gracefully
const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your-api-key';

let app;
let auth;
let googleProvider;
let db;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  db = getFirestore(app);
} else {
  console.warn(
    "Firebase is not configured. Please create a .env file based on .env.example with your Firebase credentials to enable cloud sync."
  );
}

export { auth, googleProvider, db, isFirebaseConfigured };
