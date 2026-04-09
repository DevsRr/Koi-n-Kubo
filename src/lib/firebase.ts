import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - In production, use environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBWF52sRLmvXOIVdz_6lnPe7h0oOjXVuuI",
  authDomain: "koi-restaurant-cd9fa.firebaseapp.com",
  projectId: "koi-restaurant-cd9fa",
  storageBucket: "koi-restaurant-cd9fa.firebasestorage.app",
  messagingSenderId: "714063267417",
  appId: "1:714063267417:web:51c6530a6d28876d2c5348",
  measurementId: "G-JKCTC8SLEG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
