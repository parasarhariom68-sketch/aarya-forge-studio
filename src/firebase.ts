// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDRQP9oQKFi0xx_75AnWr55QSlfsohZkx0",
  authDomain: "aarya-forge-studio.firebaseapp.com",
  projectId: "aarya-forge-studio",
  storageBucket: "aarya-forge-studio.firebasestorage.app",
  messagingSenderId: "914967920760",
  appId: "1:914967920760:web:97345a3833e962a5b12d8d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;