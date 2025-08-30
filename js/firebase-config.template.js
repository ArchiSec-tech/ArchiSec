// Firebase Configuration Template
// Copia questo file come firebase-config.js e sostituisci i valori con quelli del tuo progetto
// IMPORTANTE: Non committare mai firebase-config.js con le tue chiavi reali!

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// Sostituisci questi placeholder con i tuoi valori reali
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Auth
const auth = firebase.auth();

// Initialize Firestore
const db = firebase.firestore();

// Export per utilizzo in altri file
window.auth = auth;
window.db = db;
